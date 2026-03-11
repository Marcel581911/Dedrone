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

    if (missingSkill && !finalContent) {
      finalContent = `I don't have the "${missingSkill}" skill yet. A gap has been recorded for future development.`;
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

  // Current date/time context
  const now = new Date();
  prompt += `\n\n## Current Date & Time\n${now.toUTCString()} (UTC)`;

  // User context + pending summary
  const [user, pendingTasks, todayEvents, pendingReminders, automations, allAgents] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, city: true, timezone: true } }),
    prisma.ticket.count({ where: { userId, status: { in: ["queued", "in_progress"] } } }),
    prisma.calendarEvent.count({
      where: {
        userId,
        startAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
      },
    }),
    prisma.reminder.count({ where: { userId, status: "pending", dueAt: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } } }),
    prisma.automation.findMany({ where: { status: "active" }, select: { id: true, what: true, frequency: true }, take: 10 }),
    prisma.agent.findMany({
      where: { enabled: true, OR: [{ userId }, { userId: null }] },
      select: { id: true, name: true, role: true, mission: true },
    }),
  ]);

  if (user) {
    prompt += `\n\n## User\nName: ${user.name}`;
    if (user.city) prompt += ` | City: ${user.city}`;
    if (user.timezone) prompt += ` | Timezone: ${user.timezone}`;
  }

  prompt += `\n\n## Current Status\n- Pending tasks: ${pendingTasks}\n- Events today: ${todayEvents}\n- Reminders due in 24h: ${pendingReminders}`;

  if (automations.length > 0) {
    prompt += `\n\n## Active Automations (already set up — do NOT recreate these)\n`;
    for (const a of automations) {
      prompt += `\n  - [${a.id}] ${a.what}${a.frequency ? ` (${a.frequency})` : ""}`;
    }
    prompt += `\n\nBefore creating an automation, check this list to avoid duplicates.`;
  }

  if (allAgents.length > 1) {
    prompt += `\n\n## Agent Team\n`;
    for (const a of allAgents) {
      prompt += a.id === agent.id
        ? `\n  - ${a.name} (ID: ${a.id}) — YOU`
        : `\n  - ${a.name} (ID: ${a.id}) — ${a.role}: ${a.mission}`;
    }
    prompt += `\n\nTo delegate: create_ticket then assign_ticket with ticketId and agent ID.`;
  }

  if (skills.length > 0) {
    prompt += `\n\n## Your Tools\n`;
    for (const s of skills) prompt += `\n  - ${s.name}: ${s.description}`;
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
