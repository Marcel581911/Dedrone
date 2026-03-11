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
      name, description,
      inputSchema: JSON.stringify({ type: "object", properties: inputProps, required }),
      outputSchema: JSON.stringify({ type: "object" }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });
}

async function main() {
  console.log("Seeding database...");

  // Global settings (API keys, integrations — not per-user preferences)
  const defaultSettings: [string, string][] = [
    ["openai_api_key", ""],
    ["default_model", "gpt-4o-mini"],
    ["telegram_bot_token", ""],
    ["email_imap_host", ""], ["email_imap_port", "993"], ["email_imap_user", ""], ["email_imap_pass", ""],
    ["email_smtp_host", ""], ["email_smtp_port", "587"], ["email_smtp_user", ""], ["email_smtp_pass", ""],
    ["email_from_address", ""], ["email_from_name", "GULLI"],
  ];
  for (const [k, v] of defaultSettings) await upsertSetting(k, v);

  // Skills (global — shared across all users)
  const skills = {
    summarize_text: await upsertSkill("summarize_text", "Summarize a given text into key points",
      { text: { type: "string", description: "Text to summarize" } }, ["text"]),
    create_ticket: await upsertSkill("create_ticket", "Create a new task. Set priority, category, and optional due date.",
      { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "critical"] }, category: { type: "string", enum: ["Work", "Personal", "School", "Travel", "Health", "Finance"] }, dueAt: { type: "string", description: "ISO date-time" } }, ["title"]),
    assign_ticket: await upsertSkill("assign_ticket", "Assign a ticket to an agent by their ID.",
      { ticketId: { type: "string" }, agentId: { type: "string" } }, ["ticketId", "agentId"]),
    list_agents: await upsertSkill("list_agents", "List all available agents.", {}),
    list_tickets: await upsertSkill("list_tickets", "List tasks, optionally filtered by status.",
      { status: { type: "string", enum: ["queued", "in_progress", "done", "failed"] } }),
    read_emails: await upsertSkill("read_emails", "Read recent emails from the inbox.",
      { limit: { type: "number" }, unreadOnly: { type: "boolean" } }),
    send_email: await upsertSkill("send_email", "Send an email.",
      { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, ["to", "subject"]),
    create_automation: await upsertSkill("create_automation", "Create a new automation definition.",
      { what: { type: "string" }, systems: { type: "string" }, frequency: { type: "string" }, dataSource: { type: "string" }, delivery: { type: "string" } }, ["what"]),
    create_agent: await upsertSkill("create_agent", "Create a new agent.",
      { name: { type: "string" }, role: { type: "string" }, mission: { type: "string" }, description: { type: "string" } }, ["name", "role"]),
    manage_agent: await upsertSkill("manage_agent", "Enable or disable an agent.",
      { agentId: { type: "string" }, action: { type: "string", enum: ["enable", "disable"] } }, ["agentId", "action"]),
    set_reminder: await upsertSkill("set_reminder", "Set a reminder at a specific date/time.",
      { title: { type: "string" }, dueAt: { type: "string", description: "ISO date-time" }, recurring: { type: "string", description: "daily, weekly, monthly, or empty" } }, ["title", "dueAt"]),
    add_calendar_event: await upsertSkill("add_calendar_event", "Add an event to the calendar.",
      { title: { type: "string" }, startAt: { type: "string", description: "ISO date-time" }, endAt: { type: "string" }, location: { type: "string" }, allDay: { type: "boolean" } }, ["title", "startAt"]),
    save_note: await upsertSkill("save_note", "Save a note to the pinboard.",
      { title: { type: "string" }, content: { type: "string" }, pinned: { type: "boolean" } }, ["content"]),
  };

  // System agent (global, no userId)
  const systemAgent = await prisma.agent.upsert({
    where: { id: "system-001" },
    update: {},
    create: {
      id: "system-001",
      name: "System",
      description: "Mandatory system agent. Runs health checks, log cleanup, and scheduled maintenance.",
      role: "System maintenance",
      mission: "Keep the system healthy and operational",
      systemPrompt: "You are the System agent. Run scheduled maintenance and health checks. Report issues clearly.",
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 1024,
      enabled: true,
      isSystem: true,
      tags: JSON.stringify(["system", "maintenance"]),
    },
  });

  // Scheduled tasks
  const tasks = [
    { name: "health_check", description: "Check system health", intervalMin: 60, agentId: systemAgent.id, taskType: "system" },
    { name: "log_cleanup", description: "Remove logs older than 7 days", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "stale_ticket_check", description: "Detect stuck tickets and mark as failed", intervalMin: 120, agentId: systemAgent.id, taskType: "system" },
    { name: "email_sync", description: "Sync new emails from IMAP inbox", intervalMin: 15, agentId: systemAgent.id, taskType: "email" },
    { name: "memory_prune", description: "Remove old low-relevance memories", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "prompt_optimize", description: "Analyze token usage", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "reminder_check", description: "Check for due reminders and notify users", intervalMin: 1, agentId: systemAgent.id, taskType: "system" },
    { name: "daily_digest", description: "Send daily activity summary to each user", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "auto_backup", description: "Create daily database backup (keep last 7)", intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
  ];

  for (const t of tasks) {
    const existing = await prisma.scheduledTask.findFirst({ where: { name: t.name } });
    if (!existing) await prisma.scheduledTask.create({ data: t });
  }

  // Module registry
  const moduleDefinitions = [
    {
      slug: "finance", name: "Finance Manager", description: "Track expenses, budgets, and generate financial reports.", icon: "$",
      manifest: {
        settings: [
          { key: "bank_api_key", label: "Bank API Key", type: "password", required: false },
          { key: "currency", label: "Currency", type: "text", required: true, default: "USD" },
        ],
        agents: [{ name: "Finance Agent", role: "Financial analyst", mission: "Track and analyze finances", systemPrompt: "You are a finance assistant. Help track expenses, manage budgets, and provide financial insights.", tags: ["finance"] }],
        skills: [
          { name: "log_expense", description: "Log an expense", inputSchema: { type: "object", properties: { amount: { type: "number" }, category: { type: "string" }, description: { type: "string" } }, required: ["amount", "category"] } },
          { name: "budget_report", description: "Generate a budget summary", inputSchema: { type: "object", properties: { period: { type: "string" } } } },
        ],
        scheduledTasks: [{ name: "weekly_finance_report", description: "Generate weekly spending summary", intervalMin: 10080 }],
      },
    },
    {
      slug: "travel", name: "Trip Planner", description: "Plan trips, manage itineraries, and organize travel.", icon: "✈",
      manifest: {
        settings: [{ key: "home_airport", label: "Home Airport Code", type: "text", required: false, default: "" }],
        agents: [{ name: "Travel Agent", role: "Travel planner", mission: "Plan and organize trips", systemPrompt: "You are a travel planning assistant.", tags: ["travel"] }],
        skills: [
          { name: "create_itinerary", description: "Create a travel itinerary", inputSchema: { type: "object", properties: { destination: { type: "string" }, startDate: { type: "string" }, endDate: { type: "string" } }, required: ["destination"] } },
        ],
      },
    },
    {
      slug: "school", name: "School Manager", description: "Track assignments, grades, and school activities.", icon: "📚",
      manifest: {
        settings: [
          { key: "school_name", label: "School Name", type: "text", required: true },
          { key: "student_name", label: "Student Name", type: "text", required: true },
        ],
        agents: [{ name: "School Agent", role: "Education assistant", mission: "Help manage school tasks", systemPrompt: "You are a school management assistant. Help track homework, assignments, and schedules.", tags: ["school"] }],
        skills: [
          { name: "add_assignment", description: "Add a homework assignment", inputSchema: { type: "object", properties: { subject: { type: "string" }, title: { type: "string" }, dueDate: { type: "string" } }, required: ["subject", "title"] } },
        ],
      },
    },
    {
      slug: "health", name: "Health & Wellness", description: "Track health metrics, medications, and appointments.", icon: "❤",
      manifest: {
        settings: [{ key: "user_dob", label: "Date of Birth", type: "text", required: false }],
        agents: [{ name: "Health Agent", role: "Health assistant", mission: "Help track health and wellness", systemPrompt: "You are a health and wellness assistant. Never provide medical diagnoses.", tags: ["health"] }],
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

  await prisma.logEntry.create({ data: { level: "info", source: "system", message: "System initialized" } });
  console.log("Seed complete! — system agent, skills, scheduled tasks, modules ready.");
  console.log("Note: Personal agents are created when each user registers.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
