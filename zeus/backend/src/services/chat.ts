import OpenAI from "openai";
import { prisma } from "../db.js";
import { log } from "../logger.js";

export async function chatWithAgent(agentId: string, conversationId: string, userMessage: string) {
  const agent = await prisma.agent.findUniqueOrThrow({
    where: { id: agentId },
    include: { agentSkills: { include: { skill: true } } },
  });

  const apiKeySetting = await prisma.setting.findUnique({ where: { key: "openai_api_key" } });
  if (!apiKeySetting?.value) {
    throw new Error("OpenAI API key not configured. Go to Settings to add it.");
  }

  const enabledSkills = agent.agentSkills
    .filter((as) => as.skill.enabled)
    .map((as) => as.skill);

  // Save user message
  await prisma.message.create({
    data: { conversationId, role: "user", content: userMessage },
  });

  // Check for missing skills by analyzing the user request
  const missingSkill = await detectMissingSkill(userMessage, enabledSkills.map((s) => s.name), agentId);

  const previousMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const tools: OpenAI.ChatCompletionTool[] = enabledSkills.map((skill) => ({
    type: "function" as const,
    function: {
      name: skill.name,
      description: skill.description,
      parameters: JSON.parse(skill.inputSchema || "{}"),
    },
  }));

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(agent, enabledSkills) },
    ...previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const client = new OpenAI({ apiKey: apiKeySetting.value });

  try {
    const completion = await client.chat.completions.create({
      model: agent.model,
      messages,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      ...(tools.length > 0 ? { tools } : {}),
    });

    const choice = completion.choices[0];
    let responseContent = choice.message.content || "";

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolResults: string[] = [];
      for (const tc of choice.message.tool_calls) {
        const skillName = tc.function.name;
        const skill = enabledSkills.find((s) => s.name === skillName);
        if (!skill) {
          await createSkillGap(skillName, `Tool call from agent ${agent.name}: ${userMessage}`, agentId);
          toolResults.push(`[Skill "${skillName}" is not available. A skill gap has been recorded.]`);
        } else {
          toolResults.push(`[Skill "${skillName}" invoked with args: ${tc.function.arguments}. Execution is simulated — implement the skill for real results.]`);
        }
      }
      responseContent = (responseContent ? responseContent + "\n\n" : "") + toolResults.join("\n");
    }

    if (missingSkill) {
      responseContent = (responseContent ? responseContent + "\n\n" : "") +
        `⚠ I detected that this request may require the skill "${missingSkill}" which is not currently available. A skill gap has been recorded.`;
    }

    const assistantMsg = await prisma.message.create({
      data: { conversationId, role: "assistant", content: responseContent },
    });

    // Update conversation title from first message if it's the default
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conv && conv.title === "New Conversation") {
      const title = userMessage.slice(0, 60) + (userMessage.length > 60 ? "..." : "");
      await prisma.conversation.update({ where: { id: conversationId }, data: { title } });
    }

    await log("info", "chat", `Agent ${agent.name} responded`, { agentId, conversationId });

    return { message: assistantMsg, missingSkill };
  } catch (e: any) {
    await log("error", "chat", `Chat error: ${e.message}`, { agentId });
    throw e;
  }
}

function buildSystemPrompt(
  agent: { name: string; role: string; mission: string; systemPrompt: string },
  skills: { name: string; description: string }[]
): string {
  let prompt = agent.systemPrompt;
  prompt += `\n\nYou are ${agent.name}, a ${agent.role}.`;
  prompt += `\nYour mission: ${agent.mission}`;
  if (skills.length > 0) {
    prompt += `\n\nAvailable skills: ${skills.map((s) => `${s.name} (${s.description})`).join(", ")}`;
    prompt += `\nIf a user asks for something that requires a capability you don't have, clearly state you lack that skill. Do NOT pretend to have capabilities you don't.`;
  } else {
    prompt += `\n\nYou have no registered skills. If a user asks for something that requires a specific capability, clearly state you lack that skill.`;
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

async function detectMissingSkill(
  message: string,
  availableSkillNames: string[],
  agentId: string
): Promise<string | null> {
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
  const existing = await prisma.skillGap.findFirst({
    where: { skillName, resolved: false },
  });
  if (existing) return existing;

  const gap = await prisma.skillGap.create({
    data: { skillName, triggerContext, agentId },
  });
  await log("warn", "skill-gap", `Missing skill detected: ${skillName}`, { skillName, agentId, triggerContext });
  return gap;
}
