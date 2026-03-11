import { prisma } from "../db.js";
import { log } from "../logger.js";
import { chatWithAgent } from "./chat.js";
import { storeMemory } from "./memory.js";
import { createNotification } from "../routes/notifications.js";

const POLL_INTERVAL = 5000;

async function processNextTicket(): Promise<boolean> {
  const ticket = await prisma.ticket.findFirst({
    where: { status: "queued" },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: { agent: true },
  });

  if (!ticket) return false;

  await log("info", "worker", `Processing ticket: "${ticket.title}"`, { ticketId: ticket.id });
  console.log(`  [worker] Processing: "${ticket.title}"`);

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "in_progress" } });

  try {
    if (!ticket.agent) {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "failed", output: "No agent assigned." } });
      await log("warn", "worker", `Ticket "${ticket.title}" has no assigned agent`);
      return true;
    }

    const conversation = await prisma.conversation.create({
      data: { agentId: ticket.agent.id, title: `Ticket: ${ticket.title}` },
    });

    const taskPrompt = [
      `You are processing a ticket assigned to you.`,
      ``,
      `**Title:** ${ticket.title}`,
      `**Description:** ${ticket.description || "(no description)"}`,
      `**Priority:** ${ticket.priority}`,
      ``,
      `Provide a thorough, actionable response. This is your deliverable for this task.`,
    ].join("\n");

    const userId = ticket.userId || "";
    const result = await chatWithAgent(ticket.agent.id, conversation.id, taskPrompt, userId);
    const output = result.message.content;

    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "done", output } });

    await storeMemory(
      ticket.agent.id,
      `Completed ticket "${ticket.title}": ${output.slice(0, 2000)}`,
      "ticket_result",
      { ticketId: ticket.id }
    );

    // Deliver result back to the user
    await deliverTicketResult(ticket, ticket.agent.name, output, userId);

    await log("info", "worker", `Ticket completed: "${ticket.title}"`, { ticketId: ticket.id });
    console.log(`  [worker] Completed: "${ticket.title}"`);
    return true;
  } catch (e: any) {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "failed", output: `Error: ${e.message}` } });

    if (ticket.userId) {
      await createNotification(ticket.userId, "ticket_failed", `Task failed: ${ticket.title}`, e.message, "/tools/todo");
    }

    await log("error", "worker", `Ticket failed: ${e.message}`, { ticketId: ticket.id });
    console.error(`  [worker] Failed: "${ticket.title}" — ${e.message}`);
    return true;
  }
}

async function deliverTicketResult(ticket: any, agentName: string, output: string, userId: string) {
  if (!userId) return;

  // 1. In-app notification
  await createNotification(
    userId,
    "ticket_done",
    `${agentName} finished: ${ticket.title}`,
    output.slice(0, 300),
    "/tools/todo"
  );

  // 2. Post result into the orchestrator's active conversation so Marcel can reference it
  const orchAgent = await prisma.agent.findFirst({
    where: { id: `orch-${userId}` },
  });
  if (!orchAgent) return;

  // Find the most recent orchestrator conversation
  const orchConv = await prisma.conversation.findFirst({
    where: { agentId: orchAgent.id },
    orderBy: { updatedAt: "desc" },
  });
  if (!orchConv) return;

  // Inject a system message so Marcel knows the background task is done
  const summary = output.length > 800 ? output.slice(0, 800) + "…" : output;
  await prisma.message.create({
    data: {
      conversationId: orchConv.id,
      role: "system",
      content: `[Background task completed by ${agentName}]\n\nTask: ${ticket.title}\n\nResult:\n${summary}`,
    },
  });
}

export function startWorker() {
  console.log(`⚙ ZEUS Worker running — polling every ${POLL_INTERVAL / 1000}s`);
  log("info", "worker", "Worker started");

  const loop = async () => {
    while (true) {
      try {
        const processed = await processNextTicket();
        if (!processed) await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      } catch (e: any) {
        console.error("  [worker] Error:", e.message);
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
    }
  };

  loop();
}
