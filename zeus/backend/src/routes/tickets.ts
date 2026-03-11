import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { chatWithAgent } from "../services/chat.js";
import { log } from "../logger.js";

export async function ticketRoutes(app: FastifyInstance) {
  app.get("/api/tickets", async (req) => {
    const query = req.query as { status?: string; agentId?: string };
    const where: any = { userId: req.userId };
    if (query.status) where.status = query.status;
    if (query.agentId) where.agentId = query.agentId;
    return prisma.ticket.findMany({ where, include: { agent: true }, orderBy: { createdAt: "desc" } });
  });

  app.get("/api/tickets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.ticket.findFirst({ where: { id, userId: req.userId }, include: { agent: true } });
    if (!ticket) return reply.status(404).send({ error: "Ticket not found." });
    return ticket;
  });

  app.post("/api/tickets", async (req) => {
    const body = req.body as any;
    return prisma.ticket.create({
      data: {
        title: body.title,
        description: body.description || "",
        priority: body.priority || "medium",
        category: body.category || "Personal",
        status: body.status || "queued",
        agentId: body.agentId || null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        recurring: body.recurring || "",
        output: "",
        userId: req.userId,
      },
    });
  });

  app.put("/api/tickets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.ticket.findFirst({ where: { id, userId: req.userId } });
    if (!ticket) return reply.status(404).send({ error: "Ticket not found." });

    const body = req.body as any;
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.status !== undefined) data.status = body.status;
    if (body.agentId !== undefined) data.agentId = body.agentId;
    if (body.output !== undefined) data.output = body.output;
    if (body.category !== undefined) data.category = body.category;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.recurring !== undefined) data.recurring = body.recurring;
    if (body.status === "done") data.completedAt = new Date();
    else if (body.status === "queued" || body.status === "in_progress") data.completedAt = null;

    const updated = await prisma.ticket.update({ where: { id }, data });

    // Auto-spawn next occurrence for recurring tasks
    if (body.status === "done" && updated.recurring && updated.dueAt) {
      const next = new Date(updated.dueAt);
      if (updated.recurring === "daily") next.setDate(next.getDate() + 1);
      else if (updated.recurring === "weekly") next.setDate(next.getDate() + 7);
      else if (updated.recurring === "monthly") next.setMonth(next.getMonth() + 1);

      // Only create if next due date is in the future
      if (next > new Date()) {
        await prisma.ticket.create({
          data: {
            title: updated.title,
            description: updated.description,
            priority: updated.priority,
            category: updated.category,
            dueAt: next,
            recurring: updated.recurring,
            status: "queued",
            output: "",
            userId: updated.userId,
          },
        });
        await log("info", "tickets", `Recurring task spawned: "${updated.title}" → ${next.toISOString()}`);
      }
    }

    return updated;
  });

  app.delete("/api/tickets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.ticket.findFirst({ where: { id, userId: req.userId } });
    if (!ticket) return reply.status(404).send({ error: "Ticket not found." });
    await prisma.ticket.delete({ where: { id } });
    return { success: true };
  });

  app.post("/api/tickets/process", async (req) => {
    const ticket = await prisma.ticket.findFirst({
      where: { status: "queued", userId: req.userId },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      include: { agent: true },
    });
    if (!ticket) return { processed: false, message: "No queued tickets" };

    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "in_progress" } });

    try {
      if (!ticket.agent) {
        await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "failed", output: "No agent assigned." } });
        return { processed: true, ticketId: ticket.id, status: "failed" };
      }

      let conversation = await prisma.conversation.findFirst({
        where: { agentId: ticket.agent.id },
        orderBy: { createdAt: "desc" },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { agentId: ticket.agent.id, title: `Ticket: ${ticket.title}` },
        });
      }

      const prompt = `Process this ticket:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}\nPriority: ${ticket.priority}`;
      const result = await chatWithAgent(ticket.agent.id, conversation.id, prompt, ticket.userId || "");
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "done", output: result.message.content } });
      await log("info", "worker", `Ticket processed: ${ticket.title}`, { ticketId: ticket.id });
      return { processed: true, ticketId: ticket.id, status: "done" };
    } catch (e: any) {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "failed", output: `Error: ${e.message}` } });
      return { processed: true, ticketId: ticket.id, status: "failed", error: e.message };
    }
  });
}
