import OpenAI from "openai";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import { executeSkill } from "./skill-executor.js";
import { searchMemory, storeMemory } from "./memory.js";
import { optimizeForChat } from "./prompt-optimizer.js";
import { trackUsage } from "../routes/usage.js";

const MAX_TOOL_ROUNDS = 5;

export async function chatWithAgent(
  agentId: string,
  conversationId: string,
  userMessage: string,
  userId: string
) {
  const agent = await prisma.agent.findUniqueOrThrow({
    where: { id: agentId },
    include: { agentSkills: { include: { skill: true } } },
  });

  const apiKeySetting = await prisma.setting.findUnique({ where: { key: "openai_api_key" } });
  if (!apiKeySetting?.value) {
    throw new Error("OpenAI API key not configured. Go to Settings to add it.");
  }

  const enabledSkills = agent.agentSkills.filter((as) => as.skill.enabled).map((as) => as.skill);

  await prisma.message.create({ data: { conversationId, role: "user", content: userMessage } });

  const missingSkill = await detectMissingSkill(userMessage, enabledSkills.map((s) => s.name), agentId);

  const previousMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const systemPrompt = await buildSystemPrompt(agent, enabledSkills, userId);
  const relevantMemories = await searchMemory(agentId, userMessage, 6);
  let memoryContext = "";
  if (relevantMemories.length > 0) {
    const lines = relevantMemories.map((m) => `[${m.type}] ${m.content.slice(0, 400)}`);
    memoryContext = `\n\n## Relevant Context from Memory\n${lines.join("\n\n")}`;
  }

  const tools: OpenAI.ChatCompletionTool[] = enabledSkills.map((skill) => {
    let params = {};
    try { params = JSON.parse(skill.inputSchema || "{}"); } catch {}
    return { type: "function" as const, function: { name: skill.name, description: skill.description, parameters: params } };
  });

  const rawMessages = previousMessages.map((m) => ({ role: m.role, content: m.content }));
  const optimized = optimizeForChat(systemPrompt, rawMessages, memoryContext);

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: optimized.systemPrompt + (optimized.memoryContext ? `\n\n## Relevant Context\n${optimized.memoryContext}` : "") },
    ...optimized.messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
  ];

  const client = new OpenAI({ apiKey: apiKeySetting.value });

  try {
    let finalContent = "";
    const toolLog: string[] = [];
    let round = 0;

    while (round < MAX_TOOL_ROUNDS) {
      round++;
      const completion = await client.chat.completions.create({
        model: agent.model,
        messages: apiMessages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        ...(tools.length > 0 ? { tools } : {}),
      });

      if (completion.usage) {
        trackUsage(agent.model, completion.usage.prompt_tokens, completion.usage.completion_tokens).catch(() => {});
      }

      const choice = completion.choices[0];
      const msg = choice.message;

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalContent = msg.content || "";
        break;
      }

      apiMessages.push(msg as any);

      for (const tc of msg.tool_calls) {
        const skillName = tc.function.name;
        const skill = enabledSkills.find((s) => s.name === skillName);
        let toolResultContent: string;

        if (!skill) {
          await createSkillGap(skillName, `Tool call from agent ${agent.name}: ${userMessage}`, agentId);
          toolResultContent = JSON.stringify({ success: false, message: `Skill "${skillName}" is not available. Gap recorded.` });
          toolLog.push(`[gap] ${skillName}`);
        } else {
          const result = await executeSkill(skillName, tc.function.arguments, userId);
          toolResultContent = JSON.stringify(result);
          toolLog.push(`[${result.success ? "ok" : "fail"}] ${skillName} — ${result.message}`);
        }

        apiMessages.push({ role: "tool", tool_call_id: tc.id, content: toolResultContent } as any);
      }

      if (msg.content) finalContent = msg.content;
    }

    if (!finalContent && toolLog.length > 0) finalContent = "Done.";

    if (missingSkill) {
      finalContent += finalContent
        ? `\n\n---\n*Note: This may require the skill "${missingSkill}" which is not currently available. A skill gap has been recorded.*`
        : `I detected that this request may require the skill "${missingSkill}" which is not available. Gap recorded.`;
    }

    if (toolLog.length > 0) {
      finalContent += `\n\n---\n**Actions taken:**\n${toolLog.map((l) => `  ${l}`).join("\n")}`;
    }

    const assistantMsg = await prisma.message.create({ data: { conversationId, role: "assistant", content: finalContent } });

    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conv && conv.title === "New Conversation") {
      const title = userMessage.slice(0, 60) + (userMessage.length > 60 ? "..." : "");
      await prisma.conversation.update({ where: { id: conversationId }, data: { title } });
    }

    await log("info", "chat", `Agent ${agent.name} responded (${round} round(s), ${toolLog.length} tool calls)`, {
      agentId, conversationId, rounds: round, toolCalls: toolLog.length,
    });

    return { message: assistantMsg, missingSkill };
  } catch (e: any) {
    await log("error", "chat", `Chat error: ${e.message}`, { agentId });
    throw e;
  }
}

async function buildSystemPrompt(
  agent: { id: string; name: string; role: string; mission: string; systemPrompt: string },
  skills: { name: string; description: string }[],
  userId: string
): Promise<string> {
  let prompt = agent.systemPrompt;
  prompt += `\n\nYou are ${agent.name}, a ${agent.role}.`;
  prompt += `\nYour mission: ${agent.mission}`;

  const allAgents = await prisma.agent.findMany({
    where: { enabled: true, OR: [{ userId }, { userId: null }] },
    select: { id: true, name: true, role: true, mission: true },
  });

  if (allAgents.length > 1) {
    prompt += `\n\n## Team — Available Agents\nYou can assign work to these agents by creating tickets:`;
    for (const a of allAgents) {
      prompt += a.id === agent.id
        ? `\n  - ${a.name} (ID: ${a.id}) — THIS IS YOU`
        : `\n  - ${a.name} (ID: ${a.id}) — ${a.role}: ${a.mission}`;
    }
    prompt += `\n\nTo delegate: call create_ticket then assign_ticket with the ticketId and agent ID.`;
  }

  if (skills.length > 0) {
    prompt += `\n\n## Your Skills\n`;
    for (const s of skills) prompt += `\n  - ${s.name}: ${s.description}`;
    prompt += `\n\nIf a user asks for something you don't have a tool for, clearly state you lack that skill.`;
  } else {
    prompt += `\n\nYou have no registered tools.`;
  }

  return prompt;
}

const SKILL_DETECT_KEYWORDS: Record<string, string[]> = {
  read_email_inbox: ["email", "inbox", "mail", "read email", "check email"],
  send_email: ["send email", "compose email", "mail to"],
  web_search: ["search the web", "google", "look up online"],
  file_read: ["read file", "open file", "load file"],
  file_write: ["write file", "save file", "create file"],
  database_query: ["query database", "sql", "run query"],
  image_generate: ["generate image", "create image", "draw"],
  code_execute: ["run code", "execute code", "eval"],
};

async function detectMissingSkill(message: string, availableSkillNames: string[], agentId: string): Promise<string | null> {
  const lower = message.toLowerCase();
  for (const [skillName, keywords] of Object.entries(SKILL_DETECT_KEYWORDS)) {
    if (availableSkillNames.includes(skillName)) continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        await createSkillGap(skillName, `User message: "${message}"`, agentId);
        return skillName;
      }
    }
  }
  return null;
}

async function createSkillGap(skillName: string, triggerContext: string, agentId: string) {
  const existing = await prisma.skillGap.findFirst({ where: { skillName, resolved: false } });
  if (existing) return existing;
  const gap = await prisma.skillGap.create({ data: { skillName, triggerContext, agentId } });
  await log("warn", "skill-gap", `Missing skill: ${skillName}`, { skillName, agentId });
  return gap;
}
