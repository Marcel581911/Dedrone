import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { storeMemory, searchMemory, chunkText } from "../services/memory.js";
import { parseImportFile } from "../services/memory-import.js";
import { log } from "../logger.js";
import { guardrailError, MAX_AGENTS_PER_USER } from "../services/guardrail.js";

// Agents visible to a user: their own + system agents (userId = null)
function userAgentFilter(userId: string) {
  return { OR: [{ userId }, { userId: null }] };
}

export async function agentRoutes(app: FastifyInstance) {
  app.get("/api/agents", async (req) => {
    return prisma.agent.findMany({
      where: userAgentFilter(req.userId),
      include: { agentSkills: { include: { skill: true } } },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/api/agents/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findFirst({
      where: { id, ...userAgentFilter(req.userId) },
      include: {
        agentSkills: { include: { skill: true } },
        conversations: { orderBy: { updatedAt: "desc" } },
        tickets: { orderBy: { createdAt: "desc" } },
        memories: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!agent) return reply.status(404).send({ error: "Agent not found." });
    return agent;
  });

  app.post("/api/agents", async (req, reply) => {
    // Admins are exempt from the cap
    if (req.userRole !== "admin") {
      const count = await prisma.agent.count({ where: { userId: req.userId } });
      if (count >= MAX_AGENTS_PER_USER) {
        const g = guardrailError(
          `You have reached the agent limit (${MAX_AGENTS_PER_USER}). Log a support ticket to request an increase.`,
          "Create agent"
        );
        return reply.status(g.status).send(g.body);
      }
    }

    const body = req.body as any;
    return prisma.agent.create({
      data: {
        name: body.name,
        description: body.description || "",
        role: body.role || "",
        mission: body.mission || "",
        systemPrompt: body.systemPrompt || "You are a helpful assistant.",
        model: body.model || "gpt-4o-mini",
        temperature: body.temperature ?? 0.7,
        maxTokens: body.maxTokens ?? 2048,
        enabled: body.enabled ?? true,
        tags: JSON.stringify(body.tags || []),
        userId: req.userId,
      },
    });
  });

  app.put("/api/agents/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findFirst({ where: { id, ...userAgentFilter(req.userId) } });
    if (!agent) return reply.status(404).send({ error: "Agent not found." });

    // Non-admins cannot edit system agents
    if (req.userRole !== "admin" && (agent.isSystem || agent.userId === null)) {
      const g = guardrailError("System agents can only be modified by an admin.", "Edit system agent");
      return reply.status(g.status).send(g.body);
    }

    const body = req.body as any;
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.role !== undefined) data.role = body.role;
    if (body.mission !== undefined) data.mission = body.mission;
    if (body.systemPrompt !== undefined) data.systemPrompt = body.systemPrompt;
    if (body.model !== undefined) data.model = body.model;
    if (body.temperature !== undefined) data.temperature = body.temperature;
    if (body.maxTokens !== undefined) data.maxTokens = body.maxTokens;
    if (body.enabled !== undefined) data.enabled = body.enabled;
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    return prisma.agent.update({ where: { id }, data });
  });

  app.delete("/api/agents/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findFirst({ where: { id, userId: req.userId } });
    if (!agent) return reply.status(404).send({ error: "Agent not found or not deletable." });
    if (agent.isSystem) return reply.status(400).send({ error: "Cannot delete system agents." });
    await prisma.agent.delete({ where: { id } });
    return { success: true };
  });

  // Skills
  app.post("/api/agents/:id/skills", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findFirst({ where: { id, ...userAgentFilter(req.userId) } });
    if (!agent) return reply.status(404).send({ error: "Agent not found." });
    const { skillId } = req.body as { skillId: string };
    return prisma.agentSkill.create({ data: { agentId: id, skillId }, include: { skill: true } });
  });

  app.delete("/api/agents/:id/skills/:skillId", async (req) => {
    const { id, skillId } = req.params as { id: string; skillId: string };
    await prisma.agentSkill.deleteMany({ where: { agentId: id, skillId } });
    return { success: true };
  });

  // Conversations
  app.get("/api/agents/:id/conversations", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findFirst({ where: { id, ...userAgentFilter(req.userId) } });
    if (!agent) return reply.status(404).send({ error: "Agent not found." });
    return prisma.conversation.findMany({ where: { agentId: id }, orderBy: { updatedAt: "desc" } });
  });

  app.post("/api/agents/:id/conversations", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agent = await prisma.agent.findFirst({ where: { id, ...userAgentFilter(req.userId) } });
    if (!agent) return reply.status(404).send({ error: "Agent not found." });
    const body = req.body as any;
    return prisma.conversation.create({ data: { agentId: id, title: body?.title || "New Conversation" } });
  });

  app.get("/api/conversations/:id/messages", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" } });
  });

  // Memory
  app.get("/api/agents/:id/memory", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.memory.findMany({ where: { agentId: id }, orderBy: { createdAt: "desc" } });
  });

  app.post("/api/agents/:id/memory", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    await storeMemory(id, body.content, body.type || "note", { ticketId: body.ticketId });
    return { success: true };
  });

  app.post("/api/agents/:id/memory/search", async (req) => {
    const { id } = req.params as { id: string };
    const { query, limit } = req.body as { query: string; limit?: number };
    return searchMemory(id, query, limit || 8);
  });

  app.delete("/api/agents/:id/memory/:memId", async (req, reply) => {
    const { id, memId } = req.params as { id: string; memId: string };
    await prisma.memory.deleteMany({ where: { id: memId, agentId: id } });
    return { success: true };
  });

  // Memory import — accepts a file upload and ingests it into agent memory
  app.post("/api/agents/:id/memory/import", async (req, reply) => {
    const { id } = req.params as { id: string };

    const agent = await prisma.agent.findFirst({ where: { id, ...userAgentFilter(req.userId) } });
    if (!agent) return reply.status(404).send({ error: "Agent not found." });

    const data = await req.file();
    if (!data) return reply.status(400).send({ error: "No file provided." });

    const buffer = await data.toBuffer();
    if (buffer.length > 20 * 1024 * 1024) {
      return reply.status(400).send({ error: "File too large. Maximum 20MB." });
    }

    try {
      const { entries, format } = await parseImportFile(data.filename || "upload", buffer);

      if (entries.length === 0) {
        return { imported: 0, skipped: 0, format, message: "No importable content found in this file." };
      }

      let imported = 0;
      let skipped = 0;

      for (const entry of entries) {
        const content = entry.content.trim();
        if (content.length < 10) { skipped++; continue; }

        // Chunk large entries
        const chunks = chunkText(content);
        for (const chunk of chunks) {
          await storeMemory(id, chunk, entry.type || "import", {});
        }
        imported++;
      }

      await log("info", "memory", `Imported ${imported} entries (${format}) into agent ${id}`);
      return { imported, skipped, format, message: `Imported ${imported} entr${imported === 1 ? "y" : "ies"} from ${format} file.` };
    } catch (e: any) {
      await log("error", "memory", `Import failed for agent ${id}: ${e.message}`);
      return reply.status(400).send({ error: `Import failed: ${e.message}` });
    }
  });
}
