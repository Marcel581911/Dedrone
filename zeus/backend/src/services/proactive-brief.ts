/**
 * Proactive Brief — AI-powered personalised check-ins at 7am / 12pm / 6pm.
 *
 * Each brief gathers the user's live life-OS data, retrieves habit memories,
 * calls GPT-4o-mini to reason about what actually matters right now, and pushes
 * the result via in-app notification + Telegram.  After sending, a habit signal
 * is stored in the orchestrator's memory so future briefs keep adapting.
 */

import OpenAI from "openai";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import { searchMemory, storeMemory } from "./memory.js";
import { sendAlert } from "./alerts.js";

// ── Windows ─────────────────────────────────────────────────────────────────

const WINDOWS = [
  { type: "morning", hour: 7,  label: "Morning Brief",    emoji: "🌅" },
  { type: "midday",  hour: 12, label: "Midday Check-in",  emoji: "☀️" },
  { type: "evening", hour: 18, label: "Evening Brief",    emoji: "🌆" },
] as const;

type BriefType = "morning" | "midday" | "evening";

/** Accept ±12 min around each target hour */
const WINDOW_TOLERANCE_MIN = 12;

// ── Time helpers ─────────────────────────────────────────────────────────────

function getLocalTotalMin(timezone: string | null): number {
  const tz = timezone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", minute: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    return h * 60 + m;
  } catch {
    const d = new Date();
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
}

function getTodayKey(timezone: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── Sent-tracking (uses LogEntry so it survives restarts) ─────────────────────

async function alreadySent(userId: string, type: BriefType, dateKey: string): Promise<boolean> {
  const entry = await prisma.logEntry.findFirst({
    where: { source: "proactive-brief", message: `sent:${userId}:${type}:${dateKey}` },
  });
  return !!entry;
}

async function markSent(userId: string, type: BriefType, dateKey: string): Promise<void> {
  await prisma.logEntry.create({
    data: { level: "info", source: "proactive-brief", message: `sent:${userId}:${type}:${dateKey}` },
  });
}

// ── Context gathering ─────────────────────────────────────────────────────────

async function gatherContext(userId: string, type: BriefType) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000);
  const tomorrowEnd = new Date(todayEnd.getTime() + 86_400_000);
  const in48h = new Date(now.getTime() + 172_800_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [
    overdueTasks,
    pendingTasks,
    completedToday,
    todayEvents,
    tomorrowEvents,
    afternoonEvents,
    dueReminders,
    upcomingTrip,
    upcomingFlights,
    shoppingCount,
    netWorthData,
    monthSpending,
  ] = await Promise.all([
    prisma.ticket.findMany({
      where: { userId, status: { in: ["queued", "in_progress"] }, dueAt: { lt: now } },
      orderBy: { dueAt: "asc" }, take: 5,
      select: { title: true, priority: true, dueAt: true },
    }),
    prisma.ticket.findMany({
      where: { userId, status: { in: ["queued", "in_progress"] } },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }], take: 8,
      select: { title: true, priority: true, dueAt: true },
    }),
    prisma.ticket.findMany({
      where: { userId, status: "done", updatedAt: { gte: todayStart } },
      select: { title: true },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { startAt: "asc" }, take: 8,
      select: { title: true, startAt: true, location: true },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: todayEnd, lt: tomorrowEnd } },
      orderBy: { startAt: "asc" }, take: 5,
      select: { title: true, startAt: true },
    }),
    // Events remaining today (for midday)
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: now, lt: todayEnd } },
      orderBy: { startAt: "asc" }, take: 5,
      select: { title: true, startAt: true },
    }),
    prisma.reminder.findMany({
      where: { userId, status: "pending", dueAt: { gte: todayStart, lt: in48h } },
      orderBy: { dueAt: "asc" }, take: 5,
      select: { title: true, dueAt: true },
    }),
    prisma.trip.findFirst({
      where: { userId, startDate: { gte: todayStart }, status: { not: "past" } },
      orderBy: { startDate: "asc" },
      select: { name: true, destination: true, startDate: true, coverEmoji: true },
    }),
    prisma.tripEvent.findMany({
      where: { trip: { userId }, type: "flight", startTime: { gte: now, lt: in48h } },
      orderBy: { startTime: "asc" }, take: 3,
      select: { title: true, flightNumber: true, airline: true, fromAirport: true, toAirport: true, startTime: true, flightStatus: true, delayMinutes: true },
    }),
    prisma.shoppingItem.count({ where: { userId, status: "pending" } }),
    // Finance — total assets
    prisma.asset.aggregate({ where: { userId }, _sum: { value: true } }).catch(() => null),
    // Monthly spending by category
    prisma.transaction.groupBy({
      by: ["category"],
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 3,
    }).catch(() => []),
  ]);

  return {
    briefType: type,
    now: now.toISOString(),
    overdueTasks,
    pendingTasks,
    completedToday,
    todayEvents,
    tomorrowEvents,
    afternoonEvents,
    dueReminders,
    upcomingTrip,
    upcomingFlights,
    shoppingCount,
    netWorth: netWorthData?._sum?.value ?? null,
    monthSpending,
  };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  type: BriefType,
  ctx: Awaited<ReturnType<typeof gatherContext>>,
  user: { name: string | null; city: string | null },
  habits: string
): string {
  const dayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const focus = {
    morning: `
Focus on what matters FIRST:
1. Overdue or urgent tasks — name them specifically
2. Today's calendar with exact times
3. Flights/trips within 48h — packing, check-in reminder
4. The single most important thing to do this morning
5. Weather note if city is known`,

    midday: `
Focus on the afternoon:
1. Progress — name what was completed this morning
2. What's still open and time-sensitive
3. Events / meetings remaining today (with times)
4. Anything the user might be forgetting or drifting on
5. Reminders due this afternoon or tonight`,

    evening: `
Wind-down and tomorrow prep:
1. What was accomplished today — name specific wins
2. Tomorrow's preview: meetings, flights, important tasks
3. Anything to do or prepare tonight (pack, email, etc.)
4. Carry-over tasks the user should be aware of
5. A brief, calm closing note`,
  }[type];

  return `You are a personal life-OS assistant generating a ${type} brief for ${user.name || "the user"}.

## Context
Date: ${dayLabel}
Time window: ${type === "morning" ? "7 am" : type === "midday" ? "12 pm" : "6 pm"}
User: ${user.name || "User"}${user.city ? ` — ${user.city}` : ""}

## Habit and pattern memory (personalise based on this)
${habits || "No patterns yet — this is an early brief. Keep it general but warm."}

## Live data snapshot
${JSON.stringify(ctx, null, 2)}

## Instructions
${focus}

Rules:
- Be concise. Max 5 bullets. No filler, no generic advice.
- Reference SPECIFIC names, times, destinations, task titles from the data.
- If nothing is urgent, say so briefly and surface what IS relevant.
- Adapt tone to time of day: energising in morning, practical at midday, calm in evening.
- If a pattern from habit memory is relevant (e.g. user always has Monday standup), acknowledge it.

## Output — return ONLY valid JSON:
{
  "headline": "Under 65 chars. Sharp. Specific. E.g. '2 overdue + flight to Paris tomorrow'",
  "bullets": ["3–5 action-oriented bullets with specific details"],
  "actions": ["1–2 concrete next actions for the user RIGHT NOW"],
  "habitNote": "One sentence personalisation from habits, or null"
}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runProactiveBriefs(): Promise<string> {
  const apiKeySetting = await prisma.setting.findUnique({ where: { key: "openai_api_key" } });
  if (!apiKeySetting?.value) return "Skipped — OpenAI not configured";

  const users = await prisma.user.findMany({
    select: { id: true, name: true, timezone: true, city: true },
  });

  const client = new OpenAI({ apiKey: apiKeySetting.value });
  const { createNotification } = await import("../routes/notifications.js");

  let sent = 0;

  for (const user of users) {
    const totalMin = getLocalTotalMin(user.timezone);
    const todayKey = getTodayKey(user.timezone);

    for (const window of WINDOWS) {
      const windowMin = window.hour * 60;
      if (Math.abs(totalMin - windowMin) > WINDOW_TOLERANCE_MIN) continue;
      if (await alreadySent(user.id, window.type, todayKey)) continue;

      try {
        const ctx = await gatherContext(user.id, window.type);
        const orchId = `orch-${user.id}`;

        // Pull habit memories
        const habitMems = await searchMemory(orchId, `${window.type} brief habits patterns behaviour`, 10);
        const habits = habitMems.map((m) => `• ${m.content.slice(0, 250)}`).join("\n");

        const systemPrompt = buildSystemPrompt(window.type, ctx, user, habits);

        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.45,
          max_tokens: 700,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the brief now." },
          ],
        });

        let brief: { headline?: string; bullets?: string[]; actions?: string[]; habitNote?: string | null } = {};
        try { brief = JSON.parse(completion.choices[0].message.content || "{}"); } catch {}

        const headline  = brief.headline  || window.label;
        const bullets   = brief.bullets   || [];
        const actions   = brief.actions   || [];
        const habitNote = brief.habitNote || null;

        // ── In-app notification ──────────────────────────────────────────────
        const bodyLines = [
          ...bullets.map((b) => `• ${b}`),
          actions.length > 0 ? `\n→ ${actions.join("\n→ ")}` : "",
          habitNote ? `\n💡 ${habitNote}` : "",
        ].filter(Boolean);

        await createNotification(
          user.id,
          "brief",
          `${window.emoji} ${headline}`,
          bodyLines.join("\n"),
          "/"
        );

        // ── Telegram / SMS push ──────────────────────────────────────────────
        const tgLines = [
          `${window.emoji} *${headline}*`,
          "",
          ...bullets.map((b) => `• ${b}`),
          actions.length > 0 ? `\n*Act now:*\n${actions.map((a) => `→ ${a}`).join("\n")}` : "",
          habitNote ? `\n💡 ${habitNote}` : "",
        ].filter((l) => l !== "");

        sendAlert(user.id, tgLines.join("\n")).catch(() => {});

        // ── Store habit signal for future personalisation ────────────────────
        const signal = [
          `${window.type} brief (${todayKey}):`,
          ctx.overdueTasks.length   > 0 ? `${ctx.overdueTasks.length} overdue tasks` : null,
          ctx.completedToday.length > 0 ? `completed ${ctx.completedToday.length} task(s): ${ctx.completedToday.map((t) => t.title).slice(0, 2).join(", ")}` : null,
          ctx.upcomingFlights.length > 0 ? `flight: ${ctx.upcomingFlights[0]?.flightNumber || ctx.upcomingFlights[0]?.title}` : null,
          ctx.upcomingTrip ? `trip to ${ctx.upcomingTrip.destination} (${ctx.upcomingTrip.startDate})` : null,
          ctx.todayEvents.length > 0 ? `${ctx.todayEvents.length} event(s): ${ctx.todayEvents.slice(0, 2).map((e) => e.title).join(", ")}` : null,
          ctx.shoppingCount > 0 ? `${ctx.shoppingCount} shopping items pending` : null,
        ].filter(Boolean).join(", ");

        await storeMemory(orchId, signal, "habit", {});

        await markSent(user.id, window.type, todayKey);
        sent++;
        await log("info", "proactive-brief", `${window.label} → ${user.name || user.id}`, {
          userId: user.id, bullets: bullets.length, actions: actions.length,
        });
      } catch (e: any) {
        await log("warn", "proactive-brief", `Brief failed for ${user.id}: ${e.message}`);
      }
    }
  }

  return sent > 0 ? `Sent ${sent} proactive brief(s)` : "No briefs due";
}
