import { prisma } from "../db.js";

export async function provisionUserAgents(
  userId: string,
  assistantName: string,
  assistantPersonality: string,
  userName: string
) {
  const orchestratorId = `orch-${userId}`;
  const researcherId = `research-${userId}`;

  const existing = await prisma.agent.findUnique({ where: { id: orchestratorId } });
  if (existing) return { orchestratorId, researcherId };

  const skills = await prisma.skill.findMany({ where: { enabled: true } });
  const skillMap = Object.fromEntries(skills.map((s) => [s.name, s.id]));

  let orchPrompt = ORCHESTRATOR_PROMPT;
  if (assistantName) orchPrompt = orchPrompt.replace("You are Gulli", `You are ${assistantName}`);
  if (assistantPersonality) orchPrompt += `\n\n## Personality\n${assistantPersonality}`;
  if (userName) orchPrompt += `\n\n## User\nYour user's name is ${userName}. Address them by name when appropriate.`;

  const orchestrator = await prisma.agent.create({
    data: {
      id: orchestratorId,
      name: assistantName || "Gulli",
      description: "Your personal assistant — coordinates your agents and manages your life OS.",
      role: "Coordinator",
      mission: "Help you organize your life, manage tasks, and coordinate your agent team.",
      systemPrompt: orchPrompt,
      model: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 2048,
      enabled: true,
      userId,
      tags: JSON.stringify(["coordinator", "planner"]),
    },
  });

  const researcher = await prisma.agent.create({
    data: {
      id: researcherId,
      name: "Research Agent",
      description: "Specialist in analysis, research, and summarization.",
      role: "Research specialist",
      mission: "Analyze and summarize information, provide research-backed insights",
      systemPrompt: RESEARCHER_PROMPT,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
      enabled: true,
      userId,
      tags: JSON.stringify(["research", "analysis"]),
    },
  });

  const orchSkills = [
    "create_ticket", "assign_ticket", "list_agents", "list_tickets",
    "read_emails", "send_email", "create_automation", "create_agent",
    "manage_agent", "set_reminder", "add_calendar_event", "save_note", "summarize_text",
  ];
  for (const name of orchSkills) {
    const skillId = skillMap[name];
    if (skillId) {
      await prisma.agentSkill.upsert({
        where: { agentId_skillId: { agentId: orchestrator.id, skillId } },
        update: {},
        create: { agentId: orchestrator.id, skillId },
      });
    }
  }

  for (const name of ["summarize_text", "read_emails"]) {
    const skillId = skillMap[name];
    if (skillId) {
      await prisma.agentSkill.upsert({
        where: { agentId_skillId: { agentId: researcher.id, skillId } },
        update: {},
        create: { agentId: researcher.id, skillId },
      });
    }
  }

  return { orchestratorId, researcherId };
}

const ORCHESTRATOR_PROMPT = `You are Gulli — your personal life OS assistant.

Your mission is to help the user organize their life, manage tasks, and coordinate their agent team.

Your job is to:
1. Understand what the user needs — a task, reminder, event, or complex multi-step goal
2. Handle simple requests directly (reminders, notes, calendar events, tasks)
3. For complex goals: break them into tickets, assign to the right agents, and report back
4. Help the user stay on top of their life — surface what matters

CAPABILITIES:
- Create and manage tasks (tickets), assign them to agents
- Set reminders and calendar events
- Read and send emails
- Save notes to the pinboard
- Create automations for recurring workflows
- List and manage your agent team

RULES:
- Always use your tools to take action — do not just describe what you would do.
- For simple requests (reminders, notes, events), handle them immediately with the right tool.
- Be concise and direct. The user values results over explanations.`;

const RESEARCHER_PROMPT = `You are the Research Agent — a specialist in analysis, research, and summarization.

Your job is to:
- Analyze information thoroughly
- Provide clear, structured summaries
- Offer research-backed insights
- Summarize emails and documents when asked

When processing a ticket:
- Read the title and description carefully
- Provide a comprehensive response
- Structure your output with headings and bullet points
- Be thorough but concise`;
