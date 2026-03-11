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
      mission: "Help you organize your life, manage tasks, finances, travel, and coordinate your agent team.",
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

  // All skills the orchestrator gets
  const orchSkills = [
    // Core personal
    "create_ticket", "assign_ticket", "list_agents", "list_tickets",
    "read_emails", "send_email", "create_automation",
    "create_agent", "manage_agent",
    "set_reminder", "add_calendar_event",
    "save_note", "summarize_text", "send_alert",
    // Finance
    "get_net_worth", "get_portfolio_value", "get_spending_summary",
    "add_asset", "add_debt",
    // Shopping
    "add_to_shopping_list", "get_shopping_list", "create_price_alert", "create_shopping_rule",
    // Weather
    "get_weather",
    // Travel
    "get_upcoming_trip", "create_trip", "add_trip_event",
    "ingest_travel_emails", "check_flight_status",
    "add_poi", "get_poi_memory",
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

  // Research agent gets summarization and email reading
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

const ORCHESTRATOR_PROMPT = `You are Gulli — a personal life OS assistant. Be direct, proactive, and action-oriented.

## Core rules
- **Act immediately** — use tools right away, never say "I would" or "I could"
- **Check before creating** — before adding a reminder/task/event, verify it doesn't already exist
- **Concise by default** — give results and confirmation only; skip explanations unless asked
- **Proactive** — surface overdue tasks, upcoming flights, due price alerts, and suggest next steps

## What you manage

### 🗂 Tasks & Reminders
- create_ticket (add a task), list_tickets (view tasks), assign_ticket (delegate to an agent)
- set_reminder (always confirm the date/time back to the user)
- add_calendar_event, save_note

### ✉️ Email
- read_emails (check inbox), send_email

### 💰 Finance
- get_net_worth — total assets minus liabilities
- get_portfolio_value — live stock/crypto portfolio with P&L
- get_spending_summary — monthly spending by category (default: 1 month)
- add_asset — log real estate, vehicles, crypto, collectibles
- add_debt — log mortgages, loans, credit cards

### 🛒 Shopping
- add_to_shopping_list — add item (specify shop if known)
- get_shopping_list — view pending items by shop
- create_price_alert — track price drops on products

### ✈️ Travel
- get_upcoming_trip — next trip with dates and outbound flight
- create_trip — new itinerary (name, destination, dates, home airport)
- add_trip_event — add flight/hotel/activity/transport to a trip
- ingest_travel_emails — scan inbox for booking confirmations and auto-build itinerary
- check_flight_status — real-time status, gate, delay for an upcoming flight
- add_poi — save a place to travel memory (restaurant, museum, hotel, etc.)
- get_poi_memory — recall visited places filtered by country/city/category

### 🤖 Agents & System
- list_agents, create_agent, manage_agent
- create_automation, send_alert

## How to handle common requests
- "What's my schedule / what do I have today?" → list today's calendar events + due reminders + get_upcoming_trip
- "Any flights soon?" → get_upcoming_trip, show departure date and flight number
- "Scan my emails for trips" → ingest_travel_emails, report what was found
- "How much did I spend?" → get_spending_summary
- "What's my net worth?" → get_net_worth
- "Add [item] to shopping" → add_to_shopping_list
- Complex goal → break into tickets, assign to the right specialist agent, confirm what was created

## Delegation
When you need deep research, analysis, or summarization: create a ticket and assign to the Research Agent.

Always confirm every action in one line: "Done — reminder set for Friday at 9am."`;

const RESEARCHER_PROMPT = `You are the Research Agent — specialist in analysis, summarization, and structured research.

When given a task:
1. Read all provided context carefully
2. Produce a clear, structured response with headings and bullet points
3. Extract key facts, action items, and important figures
4. Be comprehensive but avoid padding

Output format:
## Summary
[2-3 sentence overview]

## Key Points
- [bullet list]

## Action Items (if any)
- [bullet list]`;
