import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { log } from "../logger.js";

const TICKET_SELECT = {
  id: true, title: true, description: true, type: true, status: true,
  priority: true, userId: true, assignedTo: true, resolution: true,
  tags: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, name: true, role: true } },
  assignee: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
};

export async function supportRoutes(app: FastifyInstance) {

  // ── CREATE TICKET (any authenticated user) ────────────────────────────────
  app.post("/api/support/tickets", async (req) => {
    const { title, description, type, priority } = req.body as any;
    if (!title?.trim()) throw new Error("Title is required");

    const ticket = await prisma.supportTicket.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        type: type || "support",
        priority: priority || "medium",
        userId: req.userId,
      },
      select: TICKET_SELECT,
    });

    await log("info", "support", `New support ticket: ${ticket.title}`, { userId: req.userId, type });

    // Notify admins via in-app notification
    const admins = await prisma.user.findMany({ where: { role: "admin" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "info",
          title: `New ${type || "support"} ticket`,
          body: ticket.title,
          link: `/support`,
        },
      });
    }

    return ticket;
  });

  // ── LIST TICKETS ──────────────────────────────────────────────────────────
  app.get("/api/support/tickets", async (req) => {
    const q = req.query as any;
    const isAdmin = req.userRole === "admin";
    const where: any = {};

    if (!isAdmin) where.userId = req.userId;
    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;
    if (q.priority) where.priority = q.priority;
    if (q.assignedTo) where.assignedTo = q.assignedTo;

    return prisma.supportTicket.findMany({
      where,
      select: TICKET_SELECT,
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
    });
  });

  // ── GET TICKET DETAIL ─────────────────────────────────────────────────────
  app.get("/api/support/tickets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const isAdmin = req.userRole === "admin";

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) return reply.status(404).send({ error: "Not found" });
    if (!isAdmin && ticket.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    return ticket;
  });

  // ── UPDATE TICKET ─────────────────────────────────────────────────────────
  app.put("/api/support/tickets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const isAdmin = req.userRole === "admin";
    const body = req.body as any;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return reply.status(404).send({ error: "Not found" });
    if (!isAdmin && ticket.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const data: any = {};

    // Users can only update title/description on open tickets
    if (body.title !== undefined && (isAdmin || ticket.status === "open")) data.title = body.title;
    if (body.description !== undefined && (isAdmin || ticket.status === "open")) data.description = body.description;

    // Admin-only fields
    if (isAdmin) {
      if (body.status !== undefined) data.status = body.status;
      if (body.priority !== undefined) data.priority = body.priority;
      if (body.type !== undefined) data.type = body.type;
      if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo || null;
      if (body.resolution !== undefined) data.resolution = body.resolution;
      if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
      select: TICKET_SELECT,
    });

    // Notify ticket owner of status change
    if (isAdmin && body.status && ticket.userId && ticket.userId !== req.userId) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: "info",
          title: `Ticket status updated`,
          body: `"${ticket.title}" → ${body.status}`,
          link: `/support`,
        },
      });
    }

    return updated;
  });

  // ── DELETE TICKET (admin only) ────────────────────────────────────────────
  app.delete("/api/support/tickets/:id", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only" });
    const { id } = req.params as { id: string };
    await prisma.supportTicket.delete({ where: { id } }).catch(() => {});
    return { success: true };
  });

  // ── ADD COMMENT ───────────────────────────────────────────────────────────
  app.post("/api/support/tickets/:id/comments", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { content } = req.body as any;
    if (!content?.trim()) return reply.status(400).send({ error: "Content required" });

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return reply.status(404).send({ error: "Not found" });

    const isAdmin = req.userRole === "admin";
    if (!isAdmin && ticket.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const comment = await prisma.supportComment.create({
      data: { ticketId: id, userId: req.userId, content: content.trim(), isAdmin },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    // Notify the other party
    const notifyUserId = isAdmin ? ticket.userId : (await prisma.user.findFirst({ where: { role: "admin" } }))?.id;
    if (notifyUserId && notifyUserId !== req.userId) {
      const me = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: "info",
          title: `Comment on "${ticket.title}"`,
          body: `${me?.name}: ${content.trim().slice(0, 80)}`,
          link: `/support`,
        },
      });
    }

    // Touch updatedAt on the ticket
    await prisma.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } });

    return comment;
  });

  // ── STATS (admin only) ────────────────────────────────────────────────────
  app.get("/api/support/stats", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only" });

    const [byStatus, byType, byPriority, total] = await Promise.all([
      prisma.supportTicket.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.supportTicket.groupBy({ by: ["type"], _count: { id: true } }),
      prisma.supportTicket.groupBy({ by: ["priority"], _count: { id: true } }),
      prisma.supportTicket.count(),
    ]);

    return { byStatus, byType, byPriority, total };
  });
}
