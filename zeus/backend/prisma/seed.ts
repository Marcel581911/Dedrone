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
    create_ticket: await upsertSkill("create_ticket", "Create a new task. Set priority, category, and optional due date.",
      { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "critical"] }, category: { type: "string", enum: ["Work", "Personal", "School", "Travel", "Health", "Finance"], description: "Life area this task belongs to" }, dueAt: { type: "string", description: "ISO date-time for when this is due" } }, ["title"]),
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
    create_agent: await upsertSkill("create_agent", "Create a new agent to handle specific tasks.",
      { name: { type: "string" }, role: { type: "string" }, mission: { type: "string" }, description: { type: "string" } }, ["name", "role"]),
    manage_agent: await upsertSkill("manage_agent", "Enable or disable an existing agent.",
      { agentId: { type: "string" }, action: { type: "string", enum: ["enable", "disable"] } }, ["agentId", "action"]),
    set_reminder: await upsertSkill("set_reminder", "Set a reminder for the user at a specific date/time.",
      { title: { type: "string", description: "What to remind about" }, dueAt: { type: "string", description: "ISO date-time string" }, recurring: { type: "string", description: "daily, weekly, monthly, or empty" } }, ["title", "dueAt"]),
    add_calendar_event: await upsertSkill("add_calendar_event", "Add an event to the user's calendar.",
      { title: { type: "string" }, startAt: { type: "string", description: "ISO date-time" }, endAt: { type: "string" }, location: { type: "string" }, allDay: { type: "boolean" } }, ["title", "startAt"]),
    save_note: await upsertSkill("save_note", "Save a note to the user's pinboard.",
      { title: { type: "string" }, content: { type: "string" }, pinned: { type: "boolean" } }, ["content"]),
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
    [orchestrator.id, skills.create_agent.id],
    [orchestrator.id, skills.manage_agent.id],
    [orchestrator.id, skills.set_reminder.id],
    [orchestrator.id, skills.add_calendar_event.id],
    [orchestrator.id, skills.save_note.id],
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
    { name: "memory_prune", description: "Remove old low-relevance memories to keep the system clean (max 500 per agent)", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "prompt_optimize", description: "Analyze token usage across agents and report optimization opportunities", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "reminder_check", description: "Check for due reminders and notify the user", intervalMin: 1, agentId: systemAgent.id, taskType: "system" },
    { name: "daily_digest", description: "Generate daily activity summary", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "auto_backup", description: "Create daily database backup (keep last 7)", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
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

  // ── Module Registry (available to install) ───
  const moduleDefinitions = [
    {
      slug: "finance",
      name: "Finance Manager",
      description: "Track expenses, budgets, accounts, and generate financial reports.",
      icon: "$",
      manifest: {
        settings: [
          { key: "bank_api_key", label: "Bank API Key", type: "password", required: false, description: "Connect to your bank for automatic transaction import" },
          { key: "currency", label: "Currency", type: "text", required: true, default: "USD", description: "Your primary currency (USD, EUR, GBP...)" },
        ],
        agents: [{ name: "Finance Agent", role: "Financial analyst", mission: "Track and analyze personal finances", systemPrompt: "You are a finance assistant. Help the user track expenses, manage budgets, and provide financial insights.", tags: ["finance"] }],
        skills: [
          { name: "log_expense", description: "Log an expense with amount, category, and date", inputSchema: { type: "object", properties: { amount: { type: "number" }, category: { type: "string" }, description: { type: "string" } }, required: ["amount", "category"] } },
          { name: "budget_report", description: "Generate a budget summary report", inputSchema: { type: "object", properties: { period: { type: "string" } } } },
        ],
        scheduledTasks: [{ name: "weekly_finance_report", description: "Generate weekly spending summary", intervalMin: 10080 }],
      },
    },
    {
      slug: "travel",
      name: "Trip Planner",
      description: "Plan trips, manage itineraries, track bookings, and organize travel documents.",
      icon: "✈",
      manifest: {
        settings: [
          { key: "google_maps_key", label: "Google Maps API Key", type: "password", required: false, description: "For location search and maps" },
          { key: "home_airport", label: "Home Airport Code", type: "text", required: false, default: "", description: "e.g. JFK, LAX, CDG" },
        ],
        agents: [{ name: "Travel Agent", role: "Travel planner", mission: "Plan and organize trips", systemPrompt: "You are a travel planning assistant. Help plan trips, organize itineraries, and manage bookings.", tags: ["travel"] }],
        skills: [
          { name: "create_itinerary", description: "Create a travel itinerary", inputSchema: { type: "object", properties: { destination: { type: "string" }, startDate: { type: "string" }, endDate: { type: "string" } }, required: ["destination"] } },
          { name: "find_flights", description: "Search for flight options", inputSchema: { type: "object", properties: { from: { type: "string" }, to: { type: "string" }, date: { type: "string" } }, required: ["from", "to"] } },
        ],
      },
    },
    {
      slug: "school",
      name: "School Manager",
      description: "Track assignments, grades, schedules, and school activities for kids.",
      icon: "📚",
      manifest: {
        settings: [
          { key: "school_name", label: "School Name", type: "text", required: true, description: "Name of the school" },
          { key: "student_name", label: "Student Name", type: "text", required: true, description: "Student's name" },
          { key: "school_portal_url", label: "School Portal URL", type: "text", required: false, description: "URL for the school's online portal" },
          { key: "school_portal_user", label: "Portal Username", type: "text", required: false },
          { key: "school_portal_pass", label: "Portal Password", type: "password", required: false },
        ],
        agents: [{ name: "School Agent", role: "Education assistant", mission: "Help manage school tasks and schedules", systemPrompt: "You are a school management assistant. Help track homework, assignments, grades, and school schedules.", tags: ["school", "education"] }],
        skills: [
          { name: "add_assignment", description: "Add a homework assignment", inputSchema: { type: "object", properties: { subject: { type: "string" }, title: { type: "string" }, dueDate: { type: "string" } }, required: ["subject", "title"] } },
          { name: "grade_report", description: "Generate a grade summary", inputSchema: { type: "object", properties: { student: { type: "string" } } } },
        ],
      },
    },
    {
      slug: "health",
      name: "Health & Wellness",
      description: "Track health metrics, medications, appointments, and wellness goals.",
      icon: "❤",
      manifest: {
        settings: [
          { key: "user_dob", label: "Date of Birth", type: "text", required: false, description: "For age-related health tracking" },
          { key: "fitbit_token", label: "Fitbit API Token", type: "password", required: false, description: "Connect Fitbit for automatic health data sync" },
          { key: "pharmacy_name", label: "Pharmacy Name", type: "text", required: false },
        ],
        agents: [{ name: "Health Agent", role: "Health assistant", mission: "Help track health and wellness data", systemPrompt: "You are a health and wellness assistant. Help track medications, appointments, and health metrics. Never provide medical diagnoses.", tags: ["health"] }],
        skills: [
          { name: "log_health_metric", description: "Log a health measurement", inputSchema: { type: "object", properties: { metric: { type: "string" }, value: { type: "number" }, unit: { type: "string" } }, required: ["metric", "value"] } },
        ],
      },
    },
  ];

  for (const m of moduleDefinitions) {
    await prisma.module.upsert({
      where: { slug: m.slug },
      update: {},
      create: { slug: m.slug, name: m.name, description: m.description, icon: m.icon, manifest: JSON.stringify(m.manifest), status: "available" },
    });
  }

  await prisma.logEntry.create({
    data: { level: "info", source: "system", message: "ZEUS system initialized with seed data" },
  });

  console.log("Seed complete!");
  console.log("  - 3 agents: System, Orchestrator, Research Agent");
  console.log("  - 13 skills, 9 scheduled tasks, 1 skill gap");
  console.log("  - 4 modules available: Finance, Travel, School, Health");
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
