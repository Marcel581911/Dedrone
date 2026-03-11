import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/api/notifications", async (req) => {
    const query = req.query as { unread?: string };
    const where: any = { userId: req.userId };
    if (query.unread === "true") where.read = false;
    return prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  });

  app.get("/api/notifications/count", async (req) => {
    const count = await prisma.notification.count({ where: { userId: req.userId, read: false } });
    return { count };
  });

  app.post("/api/notifications/:id/read", async (req) => {
    const { id } = req.params as { id: string };
    await prisma.notification.update({ where: { id }, data: { read: true } });
    return { success: true };
  });

  app.post("/api/notifications/read-all", async (req) => {
    await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
    return { success: true };
  });
}

export async function createNotification(userId: string, type: string, title: string, body = "", link = "") {
  if (!userId) return;
  return prisma.notification.create({ data: { userId, type, title, body, link } });
}
