import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
}

async function upsertSkill(name: string, description: string, inputProps: Record<string, any>, required: string[] = []) {
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: {
      name,
      description,
      inputSchema: JSON.stringify({ type: "object", properties: inputProps, required }),
      outputSchema: JSON.stringify({ type: "object" }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });
}

async function main() {
  console.log("Seeding ZEUS database...");

  // ── Settings ────────────────────────────────────
  const defaultSettings = [
    ["openai_api_key", ""], ["default_model", "gpt-4o-mini"], ["telegram_bot_token", ""],
    ["user_name", ""], ["assistant_name", "Zeus"], ["assistant_personality", ""],
    ["email_imap_host", ""], ["email_imap_port", "993"], ["email_imap_user", ""], ["email_imap_pass", ""],
    ["email_smtp_host", ""], ["email_smtp_port", "587"], ["email_smtp_user", ""], ["email_smtp_pass", ""],
    ["email_from_address", ""], ["email_from_name", "ZEUS"],
  ];
  for (const [k, v] of defaultSettings) await upsertSetting(k, v);

  // ── Skills ──────────────────────────────────────
  const skills = {
    summarize_text: await upsertSkill("summarize_text", "Summarize a given text into key points",
      { text: { type: "string", description: "Text to summarize" } }, ["text"]),
    create_ticket: await upsertSkill("create_ticket", "Create a new task ticket. The worker will process it automatically.",
      { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "critical"] } }, ["title"]),
    assign_ticket: await upsertSkill("assign_ticket", "Assign a ticket to an agent by their ID.",
      { ticketId: { type: "string" }, agentId: { type: "string" } }, ["ticketId", "agentId"]),
    list_agents: await upsertSkill("list_agents", "List all available agents with their IDs, roles, and missions.", {}),
    list_tickets: await upsertSkill("list_tickets", "List current tickets, optionally filtered by status.",
      { status: { type: "string", enum: ["queued", "in_progress", "done", "failed"] } }),
    read_emails: await upsertSkill("read_emails", "Read recent emails from the inbox.",
      { limit: { type: "number", description: "Max emails to return" }, unreadOnly: { type: "boolean" } }),
    send_email: await upsertSkill("send_email", "Send an email to a recipient.",
      { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, ["to", "subject"]),
    create_automation: await upsertSkill("create_automation", "Create a new automation definition.",
      { what: { type: "string" }, systems: { type: "string" }, frequency: { type: "string" }, dataSource: { type: "string" }, delivery: { type: "string" } }, ["what"]),
  };

  // ── Agents ──────────────────────────────────────

  // System Agent (mandatory, cannot be deleted)
  const systemAgent = await prisma.agent.upsert({
    where: { id: "system-001" },
    update: {},
    create: {
      id: "system-001",
      name: "System",
      description: "Mandatory system agent. Runs health checks, log cleanup, and scheduled maintenance.",
      role: "System maintenance",
      mission: "Keep the ZEUS runtime healthy and operational",
      systemPrompt: "You are the System agent. You run scheduled maintenance tasks and health checks. Report issues clearly.",
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 1024,
      enabled: true,
      isSystem: true,
      tags: JSON.stringify(["system", "maintenance"]),
    },
  });

  // Orchestrator
  const orchestrator = await prisma.agent.upsert({
    where: { id: "orchestrator-001" },
    update: { systemPrompt: ORCHESTRATOR_PROMPT },
    create: {
      id: "orchestrator-001",
      name: "Zeus",
      description: "Central coordinator that breaks down goals, creates tasks, and delegates to agents.",
      role: "Coordinator",
      mission: "Break down user goals into actionable tasks, create tickets, and assign them to agents",
      systemPrompt: ORCHESTRATOR_PROMPT,
      model: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 2048,
      enabled: true,
      tags: JSON.stringify(["coordinator", "planner"]),
    },
  });

  // Research Agent
  const researcher = await prisma.agent.upsert({
    where: { id: "researcher-001" },
    update: {},
    create: {
      id: "researcher-001",
      name: "Research Agent",
      description: "Specialist in analysis, research, and summarization of information.",
      role: "Research specialist",
      mission: "Analyze and summarize information, provide research-backed insights",
      systemPrompt: RESEARCHER_PROMPT,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
      enabled: true,
      tags: JSON.stringify(["research", "analysis"]),
    },
  });

  // ── Skill Assignments ───────────────────────────
  const assignments = [
    // Orchestrator gets coordination + email + automation skills
    [orchestrator.id, skills.create_ticket.id],
    [orchestrator.id, skills.assign_ticket.id],
    [orchestrator.id, skills.list_agents.id],
    [orchestrator.id, skills.list_tickets.id],
    [orchestrator.id, skills.read_emails.id],
    [orchestrator.id, skills.send_email.id],
    [orchestrator.id, skills.create_automation.id],
    // Researcher gets summarization + email reading
    [researcher.id, skills.summarize_text.id],
    [researcher.id, skills.read_emails.id],
  ] as const;

  for (const [agentId, skillId] of assignments) {
    await prisma.agentSkill.upsert({
      where: { agentId_skillId: { agentId, skillId } },
      update: {},
      create: { agentId, skillId },
    });
  }

  // ── Scheduled Tasks ─────────────────────────────
  const tasks = [
    { name: "health_check", description: "Check system health: agent count, ticket status, skill gaps", intervalMin: 60, agentId: systemAgent.id, taskType: "system" },
    { name: "log_cleanup", description: "Remove log entries older than 7 days", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "stale_ticket_check", description: "Detect tickets stuck in_progress for >24h and mark as failed", intervalMin: 120, agentId: systemAgent.id, taskType: "system" },
    { name: "email_sync", description: "Sync new emails from IMAP inbox", intervalMin: 15, agentId: systemAgent.id, taskType: "email" },
  ];

  for (const t of tasks) {
    const existing = await prisma.scheduledTask.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.scheduledTask.create({ data: t });
    }
  }

  // ── Example Skill Gap ───────────────────────────
  const existingGap = await prisma.skillGap.findFirst({ where: { skillName: "read_email_inbox", resolved: false } });
  if (!existingGap) {
    await prisma.skillGap.create({
      data: {
        skillName: "read_email_inbox",
        triggerContext: 'User asked: "Can you check my email inbox for new messages?"',
        agentId: orchestrator.id,
        resolved: false,
      },
    });
  }

  await prisma.logEntry.create({
    data: { level: "info", source: "system", message: "ZEUS system initialized with seed data" },
  });

  console.log("Seed complete!");
  console.log("  - 3 agents: System, Orchestrator (Zeus), Research Agent");
  console.log("  - 8 skills: tickets, agents, email, automation, summarize");
  console.log("  - 4 scheduled tasks: health, logs, stale tickets, email sync");
  console.log("  - 1 skill gap: read_email_inbox");
}

const ORCHESTRATOR_PROMPT = `You are Zeus — the central coordinator of the ZEUS agent runtime and personal AI assistant.

Your job is to:
1. Understand the user's goal
2. Break it into concrete, actionable tasks
3. Create tickets for each task using the create_ticket tool
4. Assign each ticket to the best-suited agent using assign_ticket
5. Report back what you did

WORKFLOW — always follow these steps:
1. Analyze the request
2. Decide which agent(s) should handle which part
3. Call create_ticket for each task
4. Call assign_ticket to route each ticket to the right agent
5. Confirm to the user what was created and assigned

CAPABILITIES:
- Create and manage tickets and assign them to agents
- Read and send emails on behalf of the user
- Create automations (recurring tasks)
- List available agents and their current workload

RULES:
- Always use your tools to take action. Do not just describe what you would do — actually do it.
- If a task requires a capability no agent has, say so clearly.
- Be structured: use numbered steps, clear ticket titles.
- You may process simple questions directly without creating tickets.
- When the user asks you to send an email, use the send_email tool directly.
- When the user asks about their inbox, use read_emails to check.`;

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

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
