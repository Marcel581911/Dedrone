import OpenAI from "openai";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import { generateEmbedding, cosineSimilarity } from "./memory.js";

const DEDUP_THRESHOLD = 0.92;   // cosine similarity above which two memories are considered duplicates
const DECAY_RATE      = 0.97;   // relevance multiplied by this each sweep cycle (30-day memory half-life ≈ 10 sweeps)
const DECAY_AFTER_DAYS = 14;    // only decay memories older than this
const MAX_INSIGHTS     = 5;     // GPT extracts at most this many insights per sweep

export async function runMemorySweep(): Promise<string> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let totalInsights = 0;
  let totalDecayed  = 0;
  let totalDeduped  = 0;

  for (const user of users) {
    const orchId = `orch-${user.id}`;
    const agent = await prisma.agent.findUnique({ where: { id: orchId } });
    if (!agent) continue;

    const result = await sweepUserMemory(user.id, orchId);
    totalInsights += result.insights;
    totalDecayed  += result.decayed;
    totalDeduped  += result.deduped;
  }

  const msg = `Memory sweep — ${totalInsights} insights stored, ${totalDeduped} duplicates merged, ${totalDecayed} entries decayed`;
  await log("info", "memory-sweep", msg);
  return msg;
}

async function sweepUserMemory(
  userId: string,
  agentId: string
): Promise<{ insights: number; decayed: number; deduped: number }> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ── 1. Harvest recent activity ──────────────────────────────────────────
  const [tickets, events, reminders, notes, shopping, conversations] = await Promise.all([
    prisma.ticket.findMany({
      where: { userId, updatedAt: { gte: since }, status: "done" },
      select: { title: true, description: true, output: true, category: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: since } },
      select: { title: true, startAt: true, location: true },
      orderBy: { startAt: "desc" },
      take: 15,
    }),
    prisma.reminder.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { title: true, dueAt: true, recurring: true },
      take: 15,
    }),
    prisma.note.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { title: true, content: true },
      take: 10,
    }),
    prisma.shoppingItem.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { name: true, category: true, shopId: true },
      take: 20,
    }),
    // Grab recent assistant messages from orch conversations for conversation distillation
    prisma.message.findMany({
      where: {
        conversation: { agentId },
        role: "assistant",
        createdAt: { gte: since },
      },
      select: { content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const hasActivity =
    tickets.length > 0 || events.length > 0 || reminders.length > 0 ||
    notes.length > 0 || shopping.length > 0 || conversations.length > 0;

  if (!hasActivity) return { insights: 0, decayed: 0, deduped: 0 };

  // ── 2. Build context for GPT ────────────────────────────────────────────
  const lines: string[] = [];

  if (tickets.length > 0) {
    lines.push("## Completed tasks");
    for (const t of tickets) {
      const out = t.output ? ` → ${t.output.slice(0, 120)}` : "";
      lines.push(`- [${t.category}] ${t.title}${out}`);
    }
  }

  if (events.length > 0) {
    lines.push("## Calendar events");
    for (const e of events) {
      const day = new Date(e.startAt).toLocaleDateString([], { weekday: "long", hour: "2-digit", minute: "2-digit" });
      lines.push(`- ${e.title} (${day})${e.location ? ` @ ${e.location}` : ""}`);
    }
  }

  if (reminders.length > 0) {
    lines.push("## Reminders set");
    for (const r of reminders) {
      const due = new Date(r.dueAt).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
      lines.push(`- ${r.title} at ${due}${r.recurring ? ` (recurring ${r.recurring})` : ""}`);
    }
  }

  if (notes.length > 0) {
    lines.push("## Notes saved");
    for (const n of notes) {
      lines.push(`- ${n.title || "(untitled)"}: ${n.content.slice(0, 150)}`);
    }
  }

  if (shopping.length > 0) {
    lines.push("## Shopping list additions");
    const grouped: Record<string, string[]> = {};
    for (const s of shopping) {
      const key = s.category || "General";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s.name);
    }
    for (const [cat, items] of Object.entries(grouped)) {
      lines.push(`- ${cat}: ${items.join(", ")}`);
    }
  }

  if (conversations.length > 0) {
    lines.push("## Recent conversation highlights");
    // Take last 5 meaningful assistant replies
    const meaningful = conversations
      .filter((m) => m.content.length > 40)
      .slice(0, 5);
    for (const m of meaningful) {
      lines.push(`- ${m.content.slice(0, 200)}`);
    }
  }

  // ── 3. Extract insights via GPT ─────────────────────────────────────────
  const apiKey = await prisma.setting.findUnique({ where: { key: "openai_api_key" } });
  if (!apiKey?.value) return { insights: 0, decayed: 0, deduped: 0 };

  const openai = new OpenAI({ apiKey: apiKey.value });
  let rawInsights: string[] = [];

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You extract lasting insights about a user from their recent activity.
Return JSON: { "insights": string[] } — max ${MAX_INSIGHTS} items.

Rules:
- Each insight must be a single, specific, concrete fact or pattern worth remembering long-term
- Focus on habits, preferences, recurring patterns, upcoming commitments, personal context
- Write as factual statements, not observations ("User prefers morning meetings" not "I noticed...")
- Skip one-off events with no lasting significance
- Skip things already obvious from the data (don't say "user uses a calendar")`,
        },
        { role: "user", content: lines.join("\n") },
      ],
    });

    const parsed = JSON.parse(resp.choices[0].message.content || "{}");
    rawInsights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, MAX_INSIGHTS) : [];
  } catch (e: any) {
    await log("warn", "memory-sweep", `GPT insight extraction failed: ${e.message}`);
    return { insights: 0, decayed: 0, deduped: 0 };
  }

  if (rawInsights.length === 0) return { insights: 0, decayed: 0, deduped: 0 };

  // ── 4. Deduplicate against existing memory before storing ───────────────
  const existingMemories = await prisma.memory.findMany({
    where: { agentId },
    select: { id: true, content: true, embedding: true, relevance: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  let storedCount = 0;
  let dedupedCount = 0;

  for (const insight of rawInsights) {
    if (!insight || insight.length < 10) continue;

    const insightEmb = await generateEmbedding(insight);
    if (insightEmb.length === 0) continue;

    let duplicate: (typeof existingMemories)[0] | null = null;
    for (const mem of existingMemories) {
      let memEmb: number[] = [];
      try { memEmb = JSON.parse(mem.embedding || "[]"); } catch {}
      if (cosineSimilarity(insightEmb, memEmb) >= DEDUP_THRESHOLD) {
        duplicate = mem;
        break;
      }
    }

    if (duplicate) {
      // Boost the existing memory's relevance — it was independently re-derived, so it matters
      await prisma.memory.update({
        where: { id: duplicate.id },
        data: { relevance: Math.min(1.0, duplicate.relevance + 0.08) },
      });
      dedupedCount++;
    } else {
      // New insight — store it
      await prisma.memory.create({
        data: {
          agentId,
          type: "insight",
          content: insight,
          embedding: JSON.stringify(insightEmb),
          relevance: 1.0,
          chunkIndex: 0,
        },
      });
      storedCount++;
    }
  }

  // ── 5. Relevance decay — stale, non-insight memories gradually fade ─────
  const decayCutoff = new Date(Date.now() - DECAY_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const staleMemories = await prisma.memory.findMany({
    where: {
      agentId,
      createdAt: { lt: decayCutoff },
      relevance: { gt: 0.15 },
      type: { notIn: ["insight"] }, // insights are maintained separately
    },
    select: { id: true, relevance: true },
  });

  let decayedCount = 0;
  for (const mem of staleMemories) {
    const newRelevance = Math.max(0.1, mem.relevance * DECAY_RATE);
    if (Math.abs(newRelevance - mem.relevance) > 0.001) {
      await prisma.memory.update({ where: { id: mem.id }, data: { relevance: newRelevance } });
      decayedCount++;
    }
  }

  return { insights: storedCount, decayed: decayedCount, deduped: dedupedCount };
}
