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

    const ticket = await prisma.ticket.create({
      data: { title, description, priority, status: "queued", agentId, output: "" },
    });

    await log("info", "skill:create_ticket", `Ticket created: "${title}" [${ticket.id}]`, {
      ticketId: ticket.id, priority,
    });

    return {
      success: true,
      data: { ticketId: ticket.id, title, priority, status: "queued" },
      message: `Ticket "${title}" created (ID: ${ticket.id}, priority: ${priority}, status: queued).`,
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
