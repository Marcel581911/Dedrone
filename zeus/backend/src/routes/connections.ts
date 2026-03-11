import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import { sendAlert } from "../services/alerts.js";
import { createNotification } from "./notifications.js";

export async function connectionRoutes(app: FastifyInstance) {
  // ── User: submit a request for a new external connection ────────────────
  app.post("/api/connections/requests", async (req, reply) => {
    const { service, description } = req.body as any;
    if (!service?.trim()) return reply.status(400).send({ error: "service is required" });

    // Check for duplicate pending request
    const existing = await prisma.connectionRequest.findFirst({
      where: { userId: req.userId, service: { equals: service.trim() }, status: "pending" },
    });
    if (existing) {
      return reply.status(409).send({ error: "A pending request for this service already exists." });
    }

    const request = await prisma.connectionRequest.create({
      data: {
        userId: req.userId,
        service: service.trim(),
        description: description?.trim() || "",
        status: "pending",
      },
    });

    // Notify admin(s)
    const admins = await prisma.user.findMany({ where: { role: "admin" } });
    for (const admin of admins) {
      await createNotification(
        admin.id, "info",
        `Connection request: ${service}`,
        `A user has requested access to "${service}". Review in Settings → Connections.`,
        "/settings"
      );
      sendAlert(admin.id, `🔌 *Connection request*\nService: *${service}*\nReview in Settings → Connections.`).catch(() => {});
    }

    await log("info", "connections", `Connection request submitted for "${service}"`, { userId: req.userId });
    return request;
  });

  // ── List requests ────────────────────────────────────────────────────────
  app.get("/api/connections/requests", async (req) => {
    const isAdmin = req.userRole === "admin";
    const where = isAdmin ? {} : { userId: req.userId };
    return prisma.connectionRequest.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  // ── Admin: approve or deny ───────────────────────────────────────────────
  app.put("/api/connections/requests/:id", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only" });

    const { id } = req.params as { id: string };
    const { status, adminNote } = req.body as { status: string; adminNote?: string };

    if (!["approved", "denied"].includes(status)) {
      return reply.status(400).send({ error: "status must be approved or denied" });
    }

    const cr = await prisma.connectionRequest.findUnique({ where: { id } });
    if (!cr) return reply.status(404).send({ error: "Not found" });

    const updated = await prisma.connectionRequest.update({
      where: { id },
      data: { status, adminNote: adminNote || "" },
    });

    // Notify the requesting user
    const notifTitle = status === "approved"
      ? `Connection approved: ${cr.service}`
      : `Connection request denied: ${cr.service}`;
    const notifBody = status === "approved"
      ? `Your request to connect "${cr.service}" has been approved. You can now use it in automations.`
      : `Your request for "${cr.service}" was denied.${adminNote ? ` Reason: ${adminNote}` : ""}`;

    await createNotification(cr.userId, status === "approved" ? "success" : "warning", notifTitle, notifBody);
    sendAlert(cr.userId, `${status === "approved" ? "✅" : "❌"} *${notifTitle}*\n${notifBody}`).catch(() => {});

    await log("info", "connections", `Connection request ${id} ${status} by admin`, { adminNote });
    return updated;
  });

  // ── Delete (user can cancel pending, admin can delete any) ──────────────
  app.delete("/api/connections/requests/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const cr = await prisma.connectionRequest.findUnique({ where: { id } });
    if (!cr) return reply.status(404).send({ error: "Not found" });

    if (req.userRole !== "admin" && cr.userId !== req.userId) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    if (req.userRole !== "admin" && cr.status !== "pending") {
      return reply.status(400).send({ error: "Only pending requests can be cancelled." });
    }

    await prisma.connectionRequest.delete({ where: { id } });
    return { success: true };
  });
}
