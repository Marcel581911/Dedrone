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

  // Skills
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
      implementationPath: "skills/summarize_text/index.ts",
      enabled: true,
      version: "1.0.0",
    },
  });

  const createTicketSkill = await prisma.skill.upsert({
    where: { name: "create_ticket" },
    update: {},
    create: {
      name: "create_ticket",
      description: "Create a new task ticket in the system",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
        },
        required: ["title"],
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { ticketId: { type: "string" } },
      }),
      implementationPath: "skills/create_ticket/index.ts",
      enabled: true,
      version: "1.0.0",
    },
  });

  const assignTicketSkill = await prisma.skill.upsert({
    where: { name: "assign_ticket" },
    update: {},
    create: {
      name: "assign_ticket",
      description: "Assign an existing ticket to an agent",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          ticketId: { type: "string" },
          agentId: { type: "string" },
        },
        required: ["ticketId", "agentId"],
      }),
      outputSchema: JSON.stringify({
        type: "object",
        properties: { success: { type: "boolean" } },
      }),
      implementationPath: "skills/assign_ticket/index.ts",
      enabled: true,
      version: "1.0.0",
    },
  });

  // Agent 1: Orchestrator
  const orchestrator = await prisma.agent.upsert({
    where: { id: "orchestrator-001" },
    update: {},
    create: {
      id: "orchestrator-001",
      name: "Orchestrator",
      description: "Central coordinator that breaks down goals and routes tasks to specialized agents.",
      role: "Coordinator",
      mission: "Break down goals and route tasks to appropriate agents",
      systemPrompt:
        "You are the Orchestrator, a coordination agent. Your job is to analyze user goals, break them into actionable tasks, create tickets, and assign them to the right agents. Always be structured and clear in your responses.",
      model: "gpt-4o-mini",
      temperature: 0.5,
      maxTokens: 2048,
      enabled: true,
      tags: JSON.stringify(["coordinator", "planner"]),
    },
  });

  // Agent 2: Research Agent
  const researcher = await prisma.agent.upsert({
    where: { id: "researcher-001" },
    update: {},
    create: {
      id: "researcher-001",
      name: "Research Agent",
      description: "Specialist in analysis, research, and summarization of information.",
      role: "Research specialist",
      mission: "Analyze and summarize information from various sources",
      systemPrompt:
        "You are the Research Agent. Your role is to analyze information, provide summaries, and offer research-backed insights. Be thorough and cite your reasoning.",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
      enabled: true,
      tags: JSON.stringify(["research", "analysis"]),
    },
  });

  // Assign skills
  const assignments = [
    { agentId: orchestrator.id, skillId: createTicketSkill.id },
    { agentId: orchestrator.id, skillId: assignTicketSkill.id },
    { agentId: researcher.id, skillId: summarizeSkill.id },
  ];

  for (const a of assignments) {
    await prisma.agentSkill.upsert({
      where: { agentId_skillId: { agentId: a.agentId, skillId: a.skillId } },
      update: {},
      create: a,
    });
  }

  // Example missing skill scenario: someone asked to read email inbox
  await prisma.skillGap.create({
    data: {
      skillName: "read_email_inbox",
      triggerContext: 'User asked: "Can you check my email inbox for new messages?"',
      agentId: orchestrator.id,
      resolved: false,
    },
  });

  // Seed log entries
  await prisma.logEntry.create({
    data: {
      level: "info",
      source: "system",
      message: "ZEUS system initialized with seed data",
    },
  });

  await prisma.logEntry.create({
    data: {
      level: "warn",
      source: "skill-gap",
      message: 'Missing skill detected: read_email_inbox',
      meta: JSON.stringify({ skillName: "read_email_inbox", agentId: orchestrator.id }),
    },
  });

  console.log("Seed complete!");
  console.log(`  - 2 agents created (Orchestrator, Research Agent)`);
  console.log(`  - 3 skills created (summarize_text, create_ticket, assign_ticket)`);
  console.log(`  - 1 skill gap recorded (read_email_inbox)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
