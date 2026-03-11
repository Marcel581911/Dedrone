import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { updateUserPassword, createInviteCode } from "../services/auth.js";
import { log } from "../logger.js";

const USER_SELECT = {
  id: true, name: true, role: true, city: true,
  timezone: true, assistantName: true, assistantPersonality: true, createdAt: true,
} as const;

export async function userRoutes(app: FastifyInstance) {
  // Get current user profile
  app.get("/api/users/me", async (req) => {
    return prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: USER_SELECT });
  });

  // Update own profile
  app.put("/api/users/me", async (req) => {
    const body = req.body as any;
    const data: any = {};
    if (body.city !== undefined) data.city = body.city;
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.assistantName !== undefined) data.assistantName = body.assistantName;
    if (body.assistantPersonality !== undefined) data.assistantPersonality = body.assistantPersonality;

    const user = await prisma.user.update({ where: { id: req.userId }, data, select: USER_SELECT });

    // Keep orchestrator name in sync
    if (body.assistantName !== undefined) {
      await prisma.agent.updateMany({
        where: { id: `orch-${req.userId}` },
        data: { name: body.assistantName || "Gulli" },
      });
    }

    return { success: true, user };
  });

  // List all users — admin only
  app.get("/api/users", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only." });
    return prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: "asc" } });
  });

  // Update any user — admin only
  app.put("/api/users/:id", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only." });
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const data: any = {};
    if (body.role !== undefined) data.role = body.role;
    if (body.name !== undefined) data.name = body.name;
    if (body.city !== undefined) data.city = body.city;
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.assistantName !== undefined) data.assistantName = body.assistantName;
    if (body.password) await updateUserPassword(id, body.password);

    const user = await prisma.user.update({ where: { id }, data, select: USER_SELECT });
    return { success: true, user };
  });

  // Delete user — admin only, cannot delete self
  app.delete("/api/users/:id", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only." });
    const { id } = req.params as { id: string };
    if (id === req.userId) return reply.status(400).send({ error: "Cannot delete your own account." });
    await prisma.agent.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    await log("info", "users", `User ${id} deleted by admin ${req.userId}`);
    return { success: true };
  });

  // Create invite code — admin/superuser only
  app.post("/api/invites", async (req, reply) => {
    if (req.userRole !== "admin" && req.userRole !== "superuser") {
      return reply.status(403).send({ error: "Only admins can invite members." });
    }
    const { role } = req.body as { role?: string };
    const code = await createInviteCode(req.userId, role || "user");
    const inviteUrl = `${(req.headers.origin as string) || ""}/join/${code}`;
    await log("info", "auth", `Invite created by ${req.userId}: ${code} (${role || "user"})`);
    return { code, inviteUrl };
  });

  // List invite codes — admin only
  app.get("/api/invites", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only." });
    return prisma.inviteCode.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  });
}
