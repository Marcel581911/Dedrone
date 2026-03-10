import { prisma } from "../db.js";
import { log } from "../logger.js";

const SCHEDULER_INTERVAL = 30_000; // check every 30s

const BUILTIN_TASKS: Record<string, () => Promise<string>> = {
  health_check: async () => {
    const agents = await prisma.agent.count({ where: { enabled: true } });
    const queuedTickets = await prisma.ticket.count({ where: { status: "queued" } });
    const failedTickets = await prisma.ticket.count({ where: { status: "failed" } });
    const unresolvedGaps = await prisma.skillGap.count({ where: { resolved: false } });
    const msg = `Health: ${agents} active agents, ${queuedTickets} queued tickets, ${failedTickets} failed, ${unresolvedGaps} skill gaps`;
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
    const stale = await prisma.ticket.findMany({
      where: { status: "in_progress", updatedAt: { lt: staleDate } },
    });
    if (stale.length > 0) {
      for (const t of stale) {
        await prisma.ticket.update({
          where: { id: t.id },
          data: { status: "failed", output: "Marked as failed — stuck in_progress for >24h" },
        });
      }
      const msg = `Recovered ${stale.length} stale ticket(s)`;
      await log("warn", "system-agent", msg);
      return msg;
    }
    return "No stale tickets found";
  },

  email_sync: async () => {
    const { syncInbox } = await import("./email.js");
    try {
      const count = await syncInbox();
      return `Synced ${count} new email(s)`;
    } catch (e: any) {
      return `Email sync skipped: ${e.message}`;
    }
  },

  memory_prune: async () => {
    const { pruneMemories } = await import("./memory.js");
    const count = await pruneMemories();
    return count > 0 ? `Pruned ${count} old memories` : "No memories to prune";
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
    await prisma.scheduledTask.update({
      where: { id: task.id },
      data: { lastRunAt: new Date(), nextRunAt: nextRun, lastResult: result },
    });
  } catch (e: any) {
    await prisma.scheduledTask.update({
      where: { id: task.id },
      data: { lastRunAt: new Date(), lastResult: `Error: ${e.message}` },
    });
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
          where: {
            enabled: true,
            OR: [
              { nextRunAt: null },
              { nextRunAt: { lte: now } },
            ],
          },
        });

        for (const task of dueTasks) {
          await runTask(task);
        }
      } catch (e: any) {
        console.error("  [scheduler] Error:", e.message);
      }

      await new Promise((r) => setTimeout(r, SCHEDULER_INTERVAL));
    }
  };

  loop();
}
