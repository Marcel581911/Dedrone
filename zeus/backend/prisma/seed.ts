import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ZEUS database...");

  // Default settings
  await prisma.setting.upsert({
    where: { key: "openai_api_key" },
    update: {},
    create: { key: "openai_api_key", value: "" },
  });
  await prisma.setting.upsert({
    where: { key: "default_model" },
    update: {},
    create: { key: "default_model", value: "gpt-4o-mini" },
  });

  // ── Skills ──────────────────────────────────────

  const summarizeSkill = await prisma.skill.upsert({
    where: { name: "summarize_text" },
    update: {},
    create: {
      name: "summarize_text",
      description: "Summarize a given text into key points",
      inputSchema: JSON.stringify({
        type: "object",
        properties: { text: { type: "string", description: "Text to summarize" } },
        required: ["text"],
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { summary: { type: "string" } },
      }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });

  const createTicketSkill = await prisma.skill.upsert({
    where: { name: "create_ticket" },
    update: {},
    create: {
      name: "create_ticket",
      description: "Create a new task ticket in the system. The ticket will be queued for processing by the worker.",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string", description: "Short title of the task" },
          description: { type: "string", description: "Detailed description of what needs to be done" },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Task priority" },
        },
        required: ["title"],
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { ticketId: { type: "string" }, title: { type: "string" }, status: { type: "string" } },
      }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });

  const assignTicketSkill = await prisma.skill.upsert({
    where: { name: "assign_ticket" },
    update: {},
    create: {
      name: "assign_ticket",
      description: "Assign a ticket to an agent by their ID. The worker will pick it up and the agent will process it.",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          ticketId: { type: "string", description: "The ticket ID to assign" },
          agentId: { type: "string", description: "The agent ID to assign the ticket to" },
        },
        required: ["ticketId", "agentId"],
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { success: { type: "boolean" }, agentName: { type: "string" } },
      }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });

  const listAgentsSkill = await prisma.skill.upsert({
    where: { name: "list_agents" },
    update: {},
    create: {
      name: "list_agents",
      description: "List all available agents in the system with their IDs, roles, and missions.",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {},
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { agents: { type: "array" } },
      }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });

  const listTicketsSkill = await prisma.skill.upsert({
    where: { name: "list_tickets" },
    update: {},
    create: {
      name: "list_tickets",
      description: "List current tickets, optionally filtered by status (queued, in_progress, done, failed).",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          status: { type: "string", enum: ["queued", "in_progress", "done", "failed", "blocked"], description: "Filter by status (optional)" },
        },
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { tickets: { type: "array" } },
      }),
      implementationPath: "built-in",
      enabled: true,
      version: "1.0.0",
    },
  });

  // ── Agents ──────────────────────────────────────

  const orchestrator = await prisma.agent.upsert({
    where: { id: "orchestrator-001" },
    update: {
      systemPrompt: ORCHESTRATOR_PROMPT,
    },
    create: {
      id: "orchestrator-001",
      name: "Orchestrator",
      description: "Central coordinator that breaks down goals and routes tasks to specialized agents.",
      role: "Coordinator",
      mission: "Break down user goals into actionable tasks, create tickets, and assign them to the right agents",
      systemPrompt: ORCHESTRATOR_PROMPT,
      model: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 2048,
      enabled: true,
      tags: JSON.stringify(["coordinator", "planner"]),
    },
  });

  const researcher = await prisma.agent.upsert({
    where: { id: "researcher-001" },
    update: {
      systemPrompt: RESEARCHER_PROMPT,
    },
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

  // ── Skill assignments ───────────────────────────

  const assignments = [
    { agentId: orchestrator.id, skillId: createTicketSkill.id },
    { agentId: orchestrator.id, skillId: assignTicketSkill.id },
    { agentId: orchestrator.id, skillId: listAgentsSkill.id },
    { agentId: orchestrator.id, skillId: listTicketsSkill.id },
    { agentId: researcher.id, skillId: summarizeSkill.id },
  ];

  for (const a of assignments) {
    await prisma.agentSkill.upsert({
      where: { agentId_skillId: { agentId: a.agentId, skillId: a.skillId } },
      update: {},
      create: a,
    });
  }

  // ── Example skill gap ───────────────────────────

  const existingGap = await prisma.skillGap.findFirst({
    where: { skillName: "read_email_inbox", resolved: false },
  });
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

  // ── Seed log ────────────────────────────────────

  await prisma.logEntry.create({
    data: {
      level: "info",
      source: "system",
      message: "ZEUS system initialized with seed data",
    },
  });

  console.log("Seed complete!");
  console.log(`  - 2 agents: Orchestrator, Research Agent`);
  console.log(`  - 5 skills: create_ticket, assign_ticket, list_agents, list_tickets, summarize_text`);
  console.log(`  - 1 skill gap: read_email_inbox`);
  console.log(`  - Orchestrator can create tasks and delegate to Research Agent`);
}

const ORCHESTRATOR_PROMPT = `You are the Orchestrator — the central coordinator of the ZEUS agent runtime.

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

RULES:
- Always use your tools to take action. Do not just describe what you would do — actually do it.
- If a task is best suited for a specific agent, assign it to that agent.
- If you are unsure which agent to use, use list_agents to see who is available.
- If a task requires a capability no agent has, say so clearly.
- Be structured: use numbered steps, clear ticket titles, and brief descriptions.
- You may process simple questions directly without creating tickets.`;

const RESEARCHER_PROMPT = `You are the Research Agent — a specialist in analysis, research, and summarization.

Your job is to:
- Analyze information thoroughly
- Provide clear, structured summaries
- Offer research-backed insights
- Break down complex topics into understandable parts

When processing a ticket:
- Read the title and description carefully
- Provide a comprehensive response
- Structure your output with headings and bullet points when appropriate
- Be thorough but concise`;

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
