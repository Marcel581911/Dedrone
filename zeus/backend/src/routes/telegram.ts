import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { startBot, stopBot, restartBot, getBotInfo, generatePairingCode } from "../services/telegram.js";

export async function telegramRoutes(app: FastifyInstance) {
  // Current user's bot status
  app.get("/api/telegram/status", async (req) => {
    return getBotInfo(req.userId);
  });

  // Start current user's bot
  app.post("/api/telegram/start", async (req) => {
    return startBot(req.userId);
  });

  // Stop current user's bot
  app.post("/api/telegram/stop", async (req) => {
    return stopBot(req.userId);
  });

  // Restart (called after token update)
  app.post("/api/telegram/restart", async (req) => {
    return restartBot(req.userId);
  });

  // Generate pairing code for an agent (must belong to current user)
  app.post("/api/telegram/pair/:agentId", async (req, reply) => {
    const { agentId } = req.params as { agentId: string };
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return reply.status(404).send({ error: "Agent not found" });
    if (agent.userId && agent.userId !== req.userId && req.userRole !== "admin") {
      return reply.status(403).send({ error: "Not your agent" });
    }
    const code = await generatePairingCode(agentId);
    return { code, agentName: agent.name, expiresInMinutes: 10 };
  });

  // List pairings for current user's agents only
  app.get("/api/telegram/pairings", async (req) => {
    const agentIds = (
      await prisma.agent.findMany({ where: { userId: req.userId }, select: { id: true } })
    ).map((a) => a.id);

    return prisma.telegramPairing.findMany({
      where: { agentId: { in: agentIds } },
      include: { agent: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  // Delete a pairing (must own the agent)
  app.delete("/api/telegram/pairings/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const pairing = await prisma.telegramPairing.findUnique({
      where: { id },
      include: { agent: { select: { userId: true } } },
    });
    if (!pairing) return reply.status(404).send({ error: "Not found" });
    if (pairing.agent.userId !== req.userId && req.userRole !== "admin") {
      return reply.status(403).send({ error: "Forbidden" });
    }
    await prisma.telegramPairing.delete({ where: { id } });
    return { success: true };
  });
}
