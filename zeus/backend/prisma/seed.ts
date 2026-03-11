import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
}

async function upsertSkill(name: string, description: string, inputProps: Record<string, any>, required: string[] = []) {
  return prisma.skill.upsert({
    where: { name },
    update: { description, inputSchema: JSON.stringify({ type: "object", properties: inputProps, required }) },
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

  // Global settings (admin-owned credentials — not per-user preferences)
  const defaultSettings: [string, string][] = [
    ["openai_api_key", ""],
    ["default_model", "gpt-4o-mini"],
    // Twilio SMS
    ["twilio_account_sid", ""], ["twilio_auth_token", ""], ["twilio_from", ""],
    // Email IMAP/SMTP
    ["email_imap_host", ""], ["email_imap_port", "993"], ["email_imap_user", ""], ["email_imap_pass", ""],
    ["email_smtp_host", ""], ["email_smtp_port", "587"], ["email_smtp_user", ""], ["email_smtp_pass", ""],
    ["email_from_address", ""], ["email_from_name", "GULLI"],
    // Flight tracking (AeroAPI)
    ["flight_api_key", ""], ["flight_api_url", "https://aeroapi.flightaware.com/aeroapi"],
  ];
  for (const [k, v] of defaultSettings) await upsertSetting(k, v);

  // ── Skills (global — shared across all users) ─────────────────────────────
  await upsertSkill("summarize_text", "Summarize a given text into key points",
    { text: { type: "string", description: "Text to summarize" } }, ["text"]);

  await upsertSkill("create_ticket", "Create a new task. Set priority, category, and optional due date.",
    { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "critical"] }, category: { type: "string", enum: ["Work", "Personal", "School", "Travel", "Health", "Finance"] }, dueAt: { type: "string", description: "ISO date-time" } }, ["title"]);

  await upsertSkill("assign_ticket", "Assign a ticket to an agent by their ID.",
    { ticketId: { type: "string" }, agentId: { type: "string" } }, ["ticketId", "agentId"]);

  await upsertSkill("list_agents", "List all available agents.", {});

  await upsertSkill("list_tickets", "List tasks, optionally filtered by status.",
    { status: { type: "string", enum: ["queued", "in_progress", "done", "failed"] } });

  await upsertSkill("read_emails", "Read recent emails from the inbox.",
    { limit: { type: "number" }, unreadOnly: { type: "boolean" } });

  await upsertSkill("send_email", "Send an email.",
    { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, ["to", "subject"]);

  await upsertSkill("create_automation", "Create a new automation definition.",
    { what: { type: "string" }, systems: { type: "string" }, frequency: { type: "string" }, dataSource: { type: "string" }, delivery: { type: "string" } }, ["what"]);

  await upsertSkill("create_agent", "Create a new agent.",
    { name: { type: "string" }, role: { type: "string" }, mission: { type: "string" }, description: { type: "string" } }, ["name", "role"]);

  await upsertSkill("manage_agent", "Enable or disable an agent.",
    { agentId: { type: "string" }, action: { type: "string", enum: ["enable", "disable"] } }, ["agentId", "action"]);

  await upsertSkill("set_reminder", "Set a reminder at a specific date/time.",
    { title: { type: "string" }, dueAt: { type: "string", description: "ISO date-time" }, recurring: { type: "string", description: "daily, weekly, monthly, or empty" } }, ["title", "dueAt"]);

  await upsertSkill("add_calendar_event", "Add an event to the calendar.",
    { title: { type: "string" }, startAt: { type: "string", description: "ISO date-time" }, endAt: { type: "string" }, location: { type: "string" }, allDay: { type: "boolean" } }, ["title", "startAt"]);

  await upsertSkill("save_note", "Save a note to the pinboard.",
    { title: { type: "string" }, content: { type: "string" }, pinned: { type: "boolean" } }, ["content"]);

  await upsertSkill("send_alert", "Send a push alert to the user via Telegram or SMS.",
    { message: { type: "string", description: "Alert message to send" } }, ["message"]);

  // Finance skills
  await upsertSkill("get_net_worth", "Get the user's total net worth (assets minus liabilities).", {});

  await upsertSkill("get_portfolio_value", "Get the current market value of the stock and crypto portfolio with live prices.", {});

  await upsertSkill("get_spending_summary", "Get spending breakdown by category for the last N months.",
    { months: { type: "number", description: "Number of months to look back (default: 1)" } });

  await upsertSkill("add_asset", "Add an asset (real estate, vehicle, crypto, etc.) to the financial profile.",
    { name: { type: "string" }, type: { type: "string", enum: ["real_estate", "vehicle", "crypto", "nft", "collectible", "other"] }, value: { type: "number" }, currency: { type: "string" }, purchasePrice: { type: "number" }, notes: { type: "string" } }, ["name", "type", "value"]);

  await upsertSkill("add_debt", "Add a debt or liability to the financial profile.",
    { name: { type: "string" }, type: { type: "string", enum: ["mortgage", "car_loan", "personal_loan", "credit_card", "student_loan", "other"] }, balance: { type: "number" }, interestRate: { type: "number" }, monthlyPayment: { type: "number" }, currency: { type: "string" } }, ["name", "balance"]);

  // Shopping skills
  await upsertSkill("add_to_shopping_list", "Add an item to the shopping list.",
    { name: { type: "string" }, quantity: { type: "string" }, shopId: { type: "string", description: "Shop ID (optional)" }, category: { type: "string" }, priority: { type: "string", enum: ["low", "normal", "high"] }, notes: { type: "string" } }, ["name"]);

  await upsertSkill("get_shopping_list", "Get the current shopping list, optionally filtered by shop.",
    { shopId: { type: "string" }, status: { type: "string", enum: ["pending", "bought", "skipped"] } });

  await upsertSkill("create_price_alert", "Create a price alert to track when a product drops below a target price.",
    { productName: { type: "string" }, productUrl: { type: "string" }, targetPrice: { type: "number" } }, ["productName", "productUrl", "targetPrice"]);

  await upsertSkill("create_shopping_rule", "Create a recurring shopping rule to auto-add an item to the shopping list on a schedule.",
    { itemName: { type: "string" }, trigger: { type: "string", enum: ["daily", "weekly", "monthly"] }, quantity: { type: "string" }, category: { type: "string" }, shopId: { type: "string" } }, ["itemName", "trigger"]);

  // Weather skill
  await upsertSkill("get_weather", "Get current weather and 3-day forecast for the user's city (or a specified location).",
    { city: { type: "string", description: "City name (uses profile city if omitted)" } });

  // Travel skills
  await upsertSkill("get_upcoming_trip", "Get the next upcoming trip with departure details and event count.", {});

  await upsertSkill("create_trip", "Create a new trip itinerary.",
    { name: { type: "string" }, destination: { type: "string" }, startDate: { type: "string", description: "ISO date" }, endDate: { type: "string", description: "ISO date" }, homeAirport: { type: "string", description: "IATA code, default SFO" }, notes: { type: "string" } }, ["name", "destination", "startDate", "endDate"]);

  await upsertSkill("add_trip_event", "Add a flight, hotel, activity, or transport event to an existing trip.",
    { tripId: { type: "string" }, tripName: { type: "string", description: "Trip name if tripId not known" }, type: { type: "string", enum: ["flight", "hotel", "activity", "transport", "car_rental"] }, title: { type: "string" }, startTime: { type: "string" }, endTime: { type: "string" }, location: { type: "string" }, address: { type: "string" }, bookingRef: { type: "string" }, confirmationNum: { type: "string" }, flightNumber: { type: "string" }, airline: { type: "string" }, fromAirport: { type: "string" }, toAirport: { type: "string" }, notes: { type: "string" } }, ["type", "title", "startTime"]);

  await upsertSkill("ingest_travel_emails", "Scan your email inbox for travel booking confirmations and automatically create trip itineraries.", {});

  await upsertSkill("check_flight_status", "Check real-time status of an upcoming flight (delays, gate, terminal).",
    { eventId: { type: "string", description: "TripEvent ID" }, flightNumber: { type: "string", description: "IATA flight number (e.g. UA123)" } });

  await upsertSkill("add_poi", "Save a place you visited or want to remember to your travel memory.",
    { name: { type: "string" }, city: { type: "string" }, country: { type: "string" }, category: { type: "string", enum: ["restaurant", "cafe", "museum", "hotel", "attraction", "park", "shopping", "transport", "other"] }, address: { type: "string" }, notes: { type: "string" }, visitedAt: { type: "string" } }, ["name"]);

  await upsertSkill("get_poi_memory", "Get the list of places you have visited, optionally filtered by country, city, or category.",
    { country: { type: "string" }, city: { type: "string" }, category: { type: "string" } });

  // ── System agent ──────────────────────────────────────────────────────────
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

  // ── Scheduled tasks ───────────────────────────────────────────────────────
  const tasks = [
    { name: "health_check",       description: "Check system health",                               intervalMin: 60,   agentId: systemAgent.id, taskType: "system" },
    { name: "log_cleanup",        description: "Remove logs older than 7 days",                     intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "stale_ticket_check", description: "Detect stuck tickets and mark as failed",           intervalMin: 120,  agentId: systemAgent.id, taskType: "system" },
    { name: "email_sync",         description: "Sync new emails from IMAP inbox",                   intervalMin: 15,   agentId: systemAgent.id, taskType: "email"  },
    { name: "memory_prune",       description: "Remove old low-relevance memories",                 intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "prompt_optimize",    description: "Analyze token usage",                               intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "reminder_check",     description: "Check for due reminders and notify users",          intervalMin: 1,    agentId: systemAgent.id, taskType: "system" },
    { name: "daily_digest",       description: "Send daily summary to each user",                   intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "auto_backup",        description: "Create daily database backup (keep last 7)",        intervalMin: 1440, agentId: systemAgent.id, taskType: "system" },
    { name: "price_check",        description: "Check price alerts and notify users",               intervalMin: 60,   agentId: systemAgent.id, taskType: "system" },
    { name: "shopping_rules",     description: "Auto-add recurring shopping items from rules",      intervalMin: 60,   agentId: systemAgent.id, taskType: "system" },
    { name: "flight_check",       description: "Check upcoming flight statuses and alert on delays", intervalMin: 60,  agentId: systemAgent.id, taskType: "system" },
  ];

  for (const t of tasks) {
    const existing = await prisma.scheduledTask.findFirst({ where: { name: t.name } });
    if (!existing) await prisma.scheduledTask.create({ data: t });
  }

  // ── Module registry (installable add-ons only — Finance/Shopping/Travel are built-in) ──
  const moduleDefinitions = [
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
  console.log("✅ Seed complete — system agent, skills, scheduled tasks, modules ready.");
  console.log("   Personal agents are created when each user first registers.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
