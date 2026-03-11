import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function reminderRoutes(app: FastifyInstance) {
  app.get("/api/reminders", async (req) => {
    return prisma.reminder.findMany({ where: { userId: req.userId }, orderBy: { dueAt: "asc" } });
  });

  app.post("/api/reminders", async (req) => {
    const { title, dueAt, recurring } = req.body as any;
    return prisma.reminder.create({
      data: { title, dueAt: new Date(dueAt), recurring: recurring || "", userId: req.userId },
    });
  });

  app.put("/api/reminders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const reminder = await prisma.reminder.findFirst({ where: { id, userId: req.userId } });
    if (!reminder) return reply.status(404).send({ error: "Reminder not found." });
    const body = req.body as any;
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.dueAt !== undefined) data.dueAt = new Date(body.dueAt);
    if (body.status !== undefined) data.status = body.status;
    if (body.recurring !== undefined) data.recurring = body.recurring;
    return prisma.reminder.update({ where: { id }, data });
  });

  app.delete("/api/reminders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const reminder = await prisma.reminder.findFirst({ where: { id, userId: req.userId } });
    if (!reminder) return reply.status(404).send({ error: "Reminder not found." });
    await prisma.reminder.delete({ where: { id } });
    return { success: true };
  });
}
