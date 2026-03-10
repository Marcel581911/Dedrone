import { prisma } from "../db.js";
import { log } from "../logger.js";

export interface SkillResult {
  success: boolean;
  data: Record<string, unknown>;
  message: string;
}

type SkillHandler = (args: Record<string, unknown>) => Promise<SkillResult>;

const BUILTIN_SKILLS: Record<string, SkillHandler> = {
  create_ticket: async (args) => {
    const title = String(args.title || "Untitled");
    const description = String(args.description || "");
    const priority = String(args.priority || "medium");
    const agentId = args.agentId ? String(args.agentId) : null;
    const dueAt = args.dueAt ? new Date(String(args.dueAt)) : null;

    const ticket = await prisma.ticket.create({
      data: { title, description, priority, status: "queued", agentId, output: "", dueAt },
    });

    await log("info", "skill:create_ticket", `Task created: "${title}" [${ticket.id}]`, {
      ticketId: ticket.id, priority,
    });

    const dueStr = dueAt ? ` due ${dueAt.toLocaleDateString()}` : "";
    return {
      success: true,
      data: { ticketId: ticket.id, title, priority, status: "queued" },
      message: `Task "${title}" created (priority: ${priority}${dueStr}).`,
    };
  },

  assign_ticket: async (args) => {
    const ticketId = String(args.ticketId || "");
    const agentId = String(args.agentId || "");

    if (!ticketId || !agentId) {
      return { success: false, data: {}, message: "Both ticketId and agentId are required." };
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return { success: false, data: {}, message: `Ticket ${ticketId} not found.` };
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return { success: false, data: {}, message: `Agent ${agentId} not found.` };
    }

    await prisma.ticket.update({ where: { id: ticketId }, data: { agentId } });
    await log("info", "skill:assign_ticket", `Ticket "${ticket.title}" assigned to ${agent.name}`, {
      ticketId, agentId,
    });

    return {
      success: true,
      data: { ticketId, agentId, agentName: agent.name },
      message: `Ticket "${ticket.title}" assigned to agent "${agent.name}".`,
    };
  },

  summarize_text: async (args) => {
    const text = String(args.text || "");
    if (!text) {
      return { success: false, data: {}, message: "No text provided to summarize." };
    }

    // Real summarization happens via the LLM conversation itself.
    // This skill just confirms the agent should produce a summary inline.
    return {
      success: true,
      data: { inputLength: text.length },
      message: `Received ${text.length} characters of text. Produce the summary in your response.`,
    };
  },

  list_agents: async () => {
    const agents = await prisma.agent.findMany({
      where: { enabled: true },
      select: { id: true, name: true, role: true, mission: true },
    });

    return {
      success: true,
      data: { agents },
      message: `Available agents:\n${agents.map((a) => `  - ${a.name} (ID: ${a.id}, role: ${a.role})`).join("\n")}`,
    };
  },

  read_emails: async (args) => {
    const limit = Number(args.limit) || 10;
    const unreadOnly = args.unreadOnly !== false;
    const where: any = { direction: "inbound" };
    if (unreadOnly) where.isRead = false;

    const emails = await prisma.emailMessage.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
    });

    if (emails.length === 0) {
      return { success: true, data: { emails: [] }, message: "No emails found." };
    }

    const summaries = emails.map((e) =>
      `  - From: ${e.from}\n    Subject: ${e.subject}\n    Date: ${e.date.toISOString().slice(0, 16)}\n    Preview: ${e.body.slice(0, 120)}...`
    );

    return {
      success: true,
      data: { emails: emails.map((e) => ({ id: e.id, from: e.from, subject: e.subject, date: e.date, body: e.body.slice(0, 500) })) },
      message: `${emails.length} email(s):\n${summaries.join("\n\n")}`,
    };
  },

  send_email: async (args) => {
    const { sendEmail } = await import("./email.js");
    const to = String(args.to || "");
    const subject = String(args.subject || "");
    const body = String(args.body || "");
    if (!to || !subject) {
      return { success: false, data: {}, message: "Both 'to' and 'subject' are required." };
    }
    try {
      const messageId = await sendEmail(to, subject, body);
      return { success: true, data: { messageId }, message: `Email sent to ${to}: "${subject}"` };
    } catch (e: any) {
      return { success: false, data: {}, message: `Failed to send email: ${e.message}` };
    }
  },

  create_automation: async (args) => {
    const automation = await prisma.automation.create({
      data: {
        what: String(args.what || ""),
        systems: String(args.systems || ""),
        frequency: String(args.frequency || ""),
        dataSource: String(args.dataSource || ""),
        delivery: String(args.delivery || ""),
        status: "pending",
      },
    });
    return {
      success: true,
      data: { automationId: automation.id },
      message: `Automation created: "${automation.what}" (ID: ${automation.id}). Status: pending.`,
    };
  },

  set_reminder: async (args) => {
    const title = String(args.title || "");
    const dueAt = String(args.dueAt || "");
    const recurring = String(args.recurring || "");
    if (!title || !dueAt) return { success: false, data: {}, message: "Title and dueAt are required." };

    const date = new Date(dueAt);
    if (isNaN(date.getTime())) return { success: false, data: {}, message: "Invalid date format. Use ISO format." };

    const reminder = await prisma.reminder.create({
      data: { title, dueAt: date, recurring },
    });
    return { success: true, data: { reminderId: reminder.id }, message: `Reminder set: "${title}" for ${date.toLocaleString()}${recurring ? ` (${recurring})` : ""}` };
  },

  add_calendar_event: async (args) => {
    const title = String(args.title || "");
    const startAt = String(args.startAt || "");
    if (!title || !startAt) return { success: false, data: {}, message: "Title and startAt are required." };

    const start = new Date(startAt);
    if (isNaN(start.getTime())) return { success: false, data: {}, message: "Invalid date format." };

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        startAt: start,
        endAt: args.endAt ? new Date(String(args.endAt)) : null,
        location: String(args.location || ""),
        allDay: Boolean(args.allDay),
        description: String(args.description || ""),
        source: "assistant",
      },
    });
    return { success: true, data: { eventId: event.id }, message: `Event "${title}" added to calendar on ${start.toLocaleDateString()}` };
  },

  save_note: async (args) => {
    const content = String(args.content || "");
    if (!content) return { success: false, data: {}, message: "Content is required." };

    const note = await prisma.note.create({
      data: {
        title: String(args.title || ""),
        content,
        pinned: Boolean(args.pinned),
      },
    });
    return { success: true, data: { noteId: note.id }, message: `Note saved${args.title ? `: "${args.title}"` : ""}.` };
  },

  create_agent: async (args) => {
    const name = String(args.name || "");
    const role = String(args.role || "");
    const mission = String(args.mission || "");
    if (!name) return { success: false, data: {}, message: "Agent name is required." };

    // Guardrails: limit total agents, prevent duplicates
    const count = await prisma.agent.count();
    if (count >= 20) return { success: false, data: {}, message: "Maximum 20 agents allowed. Disable unused agents first." };

    const existing = await prisma.agent.findFirst({ where: { name } });
    if (existing) return { success: false, data: {}, message: `Agent "${name}" already exists.` };

    const agent = await prisma.agent.create({
      data: {
        name,
        description: String(args.description || ""),
        role,
        mission,
        systemPrompt: String(args.systemPrompt || `You are ${name}, a ${role}. Your mission: ${mission}. Be helpful, structured, and thorough.`),
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 2048,
        enabled: true,
        tags: JSON.stringify([role.toLowerCase().replace(/\s+/g, "-")]),
      },
    });

    await log("info", "skill:create_agent", `Agent "${name}" created by Orchestrator`, { agentId: agent.id });
    return {
      success: true,
      data: { agentId: agent.id, name },
      message: `Agent "${name}" created (ID: ${agent.id}, role: ${role}). Ready to receive tasks.`,
    };
  },

  manage_agent: async (args) => {
    const agentId = String(args.agentId || "");
    const action = String(args.action || "");
    if (!agentId || !action) return { success: false, data: {}, message: "agentId and action (enable/disable) are required." };

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, data: {}, message: `Agent ${agentId} not found.` };

    // Guardrails: cannot disable system or orchestrator
    if (agent.isSystem) return { success: false, data: {}, message: "Cannot modify the System agent." };
    if (agent.id === "orchestrator-001") return { success: false, data: {}, message: "Cannot disable the Orchestrator." };

    const enabled = action === "enable";
    await prisma.agent.update({ where: { id: agentId }, data: { enabled } });
    await log("info", "skill:manage_agent", `Agent "${agent.name}" ${enabled ? "enabled" : "disabled"}`, { agentId });
    return { success: true, data: { agentId, enabled }, message: `Agent "${agent.name}" ${enabled ? "enabled" : "disabled"}.` };
  },

  list_tickets: async (args) => {
    const status = args.status ? String(args.status) : undefined;
    const where: any = {};
    if (status) where.status = status;

    const tickets = await prisma.ticket.findMany({
      where,
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (tickets.length === 0) {
      return { success: true, data: { tickets: [] }, message: "No tickets found." };
    }

    return {
      success: true,
      data: { tickets: tickets.map((t) => ({ id: t.id, title: t.title, status: t.status, agent: t.agent?.name })) },
      message: `Tickets:\n${tickets.map((t) => `  - [${t.status}] "${t.title}" (ID: ${t.id}, agent: ${t.agent?.name || "unassigned"})`).join("\n")}`,
    };
  },
};

export async function executeSkill(skillName: string, argsJson: string): Promise<SkillResult> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson || "{}");
  } catch {
    return { success: false, data: {}, message: `Invalid JSON arguments for skill ${skillName}.` };
  }

  const handler = BUILTIN_SKILLS[skillName];
  if (handler) {
    try {
      return await handler(args);
    } catch (e: any) {
      await log("error", `skill:${skillName}`, `Execution error: ${e.message}`, { args });
      return { success: false, data: {}, message: `Skill "${skillName}" threw an error: ${e.message}` };
    }
  }

  return {
    success: false,
    data: {},
    message: `Skill "${skillName}" has no built-in implementation. Generate a stub from the Skill Gaps page and implement it.`,
  };
}
