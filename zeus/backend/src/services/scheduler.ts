import { prisma } from "../db.js";
import { log } from "../logger.js";

const SCHEDULER_INTERVAL = 30_000;

const BUILTIN_TASKS: Record<string, () => Promise<string>> = {
  session_prune: async () => {
    const { pruneExpiredSessions } = await import("./auth.js");
    await pruneExpiredSessions();
    return "Expired sessions pruned";
  },

  proactive_brief: async () => {
    const { runProactiveBriefs } = await import("./proactive-brief.js");
    return runProactiveBriefs();
  },
  health_check: async () => {
    const agents = await prisma.agent.count({ where: { enabled: true } });
    const queuedTickets = await prisma.ticket.count({ where: { status: "queued" } });
    const failedTickets = await prisma.ticket.count({ where: { status: "failed" } });
    const unresolvedGaps = await prisma.skillGap.count({ where: { resolved: false } });
    const msg = `Health: ${agents} active agents, ${queuedTickets} queued, ${failedTickets} failed, ${unresolvedGaps} skill gaps`;
    await log("info", "system-agent", msg);
    return msg;
  },

  log_cleanup: async () => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.logEntry.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const msg = `Cleaned ${deleted.count} log entries older than 7 days`;
    await log("info", "system-agent", msg);
    return msg;
  },

  stale_ticket_check: async () => {
    const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stale = await prisma.ticket.findMany({ where: { status: "in_progress", updatedAt: { lt: staleDate } } });
    if (stale.length > 0) {
      for (const t of stale) {
        await prisma.ticket.update({ where: { id: t.id }, data: { status: "failed", output: "Marked failed — stuck in_progress >24h" } });
      }
      const msg = `Recovered ${stale.length} stale ticket(s)`;
      await log("warn", "system-agent", msg);
      return msg;
    }
    return "No stale tickets";
  },

  email_sync: async () => {
    const cfg = await prisma.setting.findUnique({ where: { key: "email_imap_host" } });
    if (!cfg?.value) return "Skipped — IMAP not configured";
    try {
      const { syncInbox } = await import("./email.js");
      const count = await syncInbox();
      return `Synced ${count} new email(s)`;
    } catch (e: any) {
      return `Email sync failed: ${e.message}`;
    }
  },

  reminder_check: async () => {
    const now = new Date();
    const due = await prisma.reminder.findMany({
      where: { status: "pending", notified: false, dueAt: { lte: now } },
    });
    if (due.length === 0) return "No due reminders";

    const { createNotification } = await import("../routes/notifications.js");
    const { sendAlert } = await import("./alerts.js");
    for (const r of due) {
      await createNotification(r.userId || "", "reminder", `Reminder: ${r.title}`, `Due: ${r.dueAt.toLocaleString()}`);
      if (r.userId) {
        sendAlert(r.userId, `⏰ *Reminder:* ${r.title}`).catch(() => {});
      }
      await prisma.reminder.update({ where: { id: r.id }, data: { notified: true, status: "done" } });

      if (r.recurring) {
        const next = new Date(r.dueAt);
        if (r.recurring === "daily") next.setDate(next.getDate() + 1);
        else if (r.recurring === "weekly") next.setDate(next.getDate() + 7);
        else if (r.recurring === "monthly") next.setMonth(next.getMonth() + 1);
        await prisma.reminder.create({ data: { title: r.title, dueAt: next, recurring: r.recurring, userId: r.userId } });
      }
    }
    await log("info", "system-agent", `Processed ${due.length} reminder(s)`);
    return `${due.length} reminder(s) triggered`;
  },

  daily_digest: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in48h = new Date(today.getTime() + 48 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({ select: { id: true } });
    const { createNotification } = await import("../routes/notifications.js");
    const { sendAlert } = await import("./alerts.js");

    for (const user of users) {
      const [completedTasks, upcomingEvents, pendingReminders, upcomingFlights] = await Promise.all([
        prisma.ticket.count({ where: { userId: user.id, status: "done", updatedAt: { gte: today } } }),
        prisma.calendarEvent.findMany({ where: { userId: user.id, startAt: { gte: today, lt: tomorrow } }, select: { title: true, startAt: true }, orderBy: { startAt: "asc" }, take: 5 }),
        prisma.reminder.count({ where: { userId: user.id, status: "pending", dueAt: { gte: today, lt: tomorrow } } }),
        prisma.tripEvent.findMany({
          where: { trip: { userId: user.id }, type: "flight", startTime: { gte: today, lt: in48h } },
          include: { trip: { select: { name: true } } },
          orderBy: { startTime: "asc" },
          take: 3,
        }),
      ]);

      const lines: string[] = [];
      lines.push(`📋 ${completedTasks} task(s) completed today`);
      if (upcomingEvents.length > 0) {
        lines.push(`📅 Events today: ${upcomingEvents.map((e: any) => `${e.title} at ${new Date(e.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`).join(", ")}`);
      }
      if (pendingReminders > 0) lines.push(`⏰ ${pendingReminders} reminder(s) due today`);
      if (upcomingFlights.length > 0) {
        for (const f of upcomingFlights) {
          const dept = new Date(f.startTime);
          const hoursUntil = Math.round((dept.getTime() - Date.now()) / 3600000);
          lines.push(`✈️ ${(f as any).trip.name}: ${f.flightNumber || f.title} departs in ${hoursUntil}h — Status: ${f.flightStatus}`);
        }
      }

      const body = lines.join("\n");
      await createNotification(user.id, "digest", "Daily Summary", body, "/tools/todo");

      // Also push via Telegram/SMS so the digest reaches the user even when app is closed
      if (upcomingFlights.length > 0 || upcomingEvents.length > 0 || pendingReminders > 0) {
        sendAlert(user.id, `🌅 *Daily Digest*\n${body}`).catch(() => {});
      }
    }

    await log("info", "system-agent", "Daily digests sent");
    return `Digest sent to ${users.length} user(s)`;
  },

  auto_backup: async () => {
    const { getDbPath, getDataDir } = await import("./paths.js");
    const pathMod = await import("path");
    const fs = await import("fs");
    const dbPath = getDbPath();
    const backupDir = pathMod.join(getDataDir(), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    if (!fs.existsSync(dbPath)) return "No database to backup";
    const name = `auto-${new Date().toISOString().slice(0, 10)}.db`;
    const dest = pathMod.join(backupDir, name);
    if (fs.existsSync(dest)) return "Today's backup already exists";
    fs.copyFileSync(dbPath, dest);
    const backups = fs.readdirSync(backupDir).filter((f: string) => f.startsWith("auto-")).sort().reverse();
    for (const old of backups.slice(7)) fs.unlinkSync(pathMod.join(backupDir, old));
    return `Backup created: ${name}`;
  },

  prompt_optimize: async () => {
    const { analyzeTokenUsage } = await import("./prompt-optimizer.js");
    return analyzeTokenUsage();
  },

  memory_prune: async () => {
    const { pruneMemories } = await import("./memory.js");
    const count = await pruneMemories();
    return count > 0 ? `Pruned ${count} old memories` : "No memories to prune";
  },

  price_check: async () => {
    const alerts = await prisma.priceAlert.findMany({ where: { active: true, triggered: false } });
    if (alerts.length === 0) return "No active price alerts";

    const { scrapePrice } = await import("./price-scraper.js");
    const { sendAlert } = await import("./alerts.js");
    const { createNotification } = await import("../routes/notifications.js");

    let checked = 0, triggered = 0;
    for (const alert of alerts) {
      try {
        const result = await scrapePrice(alert.productUrl);
        if (result.price === null) continue;

        // Save to history
        await prisma.priceHistory.create({ data: { alertId: alert.id, price: result.price } });
        await prisma.priceAlert.update({ where: { id: alert.id }, data: { currentPrice: result.price, lastChecked: new Date() } });

        checked++;

        if (result.price <= alert.targetPrice) {
          // Trigger!
          await prisma.priceAlert.update({ where: { id: alert.id }, data: { triggered: true } });
          triggered++;

          const msg = `Price alert: "${alert.productName}" is now ${result.price} ${alert.currency} (target: ${alert.targetPrice})`;
          if (alert.userId) {
            await createNotification(alert.userId, "info", "Price Alert!", msg, "/tools/shopping");
            sendAlert(alert.userId, msg).catch(() => {});
          }
        }
      } catch {}
    }

    return `Checked ${checked} price alert(s), ${triggered} triggered`;
  },

  flight_check: async () => {
    try {
      const { checkAllActiveFlights } = await import("./flight-tracker.js");
      await checkAllActiveFlights();
      return "Flight status check complete";
    } catch (e: any) {
      return `Flight check failed: ${e.message}`;
    }
  },

  shopping_rules: async () => {
    const now = new Date();
    const rules = await prisma.shoppingRule.findMany({ where: { enabled: true } });
    let added = 0;

    for (const rule of rules) {
      let shouldRun = false;
      if (!rule.lastRun) {
        shouldRun = true;
      } else {
        const diff = now.getTime() - rule.lastRun.getTime();
        if (rule.trigger === "daily" && diff > 86400000) shouldRun = true;
        else if (rule.trigger === "weekly" && diff > 604800000) shouldRun = true;
        else if (rule.trigger === "monthly" && diff > 2592000000) shouldRun = true;
      }

      if (!shouldRun) continue;

      // Check if item already exists in pending state
      const existing = await prisma.shoppingItem.findFirst({
        where: { userId: rule.userId, shopId: rule.shopId, name: rule.itemName, status: "pending" },
      });

      if (!existing) {
        await prisma.shoppingItem.create({
          data: {
            userId: rule.userId,
            shopId: rule.shopId || null,
            name: rule.itemName,
            quantity: rule.quantity,
            category: rule.category,
            addedBy: "rule",
          },
        });
        added++;
      }

      await prisma.shoppingRule.update({ where: { id: rule.id }, data: { lastRun: now } });
    }

    return `Shopping rules: added ${added} item(s)`;
  },
};

async function runTask(task: any): Promise<void> {
  const handler = BUILTIN_TASKS[task.name];
  if (!handler) {
    await prisma.scheduledTask.update({
      where: { id: task.id },
      data: { lastRunAt: new Date(), lastResult: `Unknown task: ${task.name}` },
    });
    return;
  }

  try {
    const result = await handler();
    const nextRun = new Date(Date.now() + task.intervalMin * 60 * 1000);
    await prisma.scheduledTask.update({ where: { id: task.id }, data: { lastRunAt: new Date(), nextRunAt: nextRun, lastResult: result } });
  } catch (e: any) {
    await prisma.scheduledTask.update({ where: { id: task.id }, data: { lastRunAt: new Date(), lastResult: `Error: ${e.message}` } });
    await log("error", "scheduler", `Task "${task.name}" failed: ${e.message}`);
  }
}

export function startScheduler() {
  console.log("📅 Scheduler running");
  log("info", "scheduler", "Scheduler started");

  const loop = async () => {
    while (true) {
      try {
        const now = new Date();
        const dueTasks = await prisma.scheduledTask.findMany({
          where: { enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
        });
        for (const task of dueTasks) await runTask(task);
      } catch (e: any) {
        console.error("  [scheduler] Error:", e.message);
      }
      await new Promise((r) => setTimeout(r, SCHEDULER_INTERVAL));
    }
  };

  loop();
}
