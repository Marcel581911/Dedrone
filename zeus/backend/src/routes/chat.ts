import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { chatWithAgent, StepEvent } from "../services/chat.js";

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

  app.post("/api/agents/:id/chat/stream", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { conversationId, message } = req.body as { conversationId: string; message: string };

    reply.hijack();

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");

    reply.raw.write(": connected\n\n");

    const send = (event: StepEvent) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // Socket already closed — swallow silently
      }
    };

    try {
      if (!message?.trim()) throw new Error("Message is required");

      const agent = await prisma.agent.findFirst({
        where: { id, OR: [{ userId: req.userId }, { userId: null }] },
      });
      if (!agent) {
        send({ type: "error", message: "Access denied." } as any);
        return;
      }

      await chatWithAgent(id, conversationId, message, req.userId, send);
    } catch (e: any) {
      send({ type: "error", message: e.message } as any);
    } finally {
      reply.raw.end();
    }
  });
}
