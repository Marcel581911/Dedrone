import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { chatWithAgent } from "../services/chat.js";

export async function chatRoutes(app: FastifyInstance) {
  app.post("/api/agents/:id/chat", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { conversationId, message } = req.body as { conversationId: string; message: string };

    if (!message?.trim()) throw new Error("Message is required");

    // Verify the agent belongs to this user or is a system/global agent
    const agent = await prisma.agent.findFirst({
      where: { id, OR: [{ userId: req.userId }, { userId: null }] },
    });
    if (!agent) return reply.status(403).send({ error: "Access denied." });

    return chatWithAgent(id, conversationId, message, req.userId);
  });
}
