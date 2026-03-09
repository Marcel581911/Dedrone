import { prisma } from "./db.js";
import { log } from "./logger.js";
import { chatWithAgent } from "./services/chat.js";

const POLL_INTERVAL = 5000;

async function processNextTicket() {
  const ticket = await prisma.ticket.findFirst({
    where: { status: "queued" },
    orderBy: [
      { priority: "asc" },
      { createdAt: "asc" },
    ],
    include: { agent: true },
  });

  if (!ticket) return false;

  await log("info", "worker", `Processing ticket: ${ticket.title}`, { ticketId: ticket.id });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "in_progress" },
  });

  try {
    if (!ticket.agent) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "failed",
          output: "No agent assigned to this ticket.",
        },
      });
      await log("warn", "worker", `Ticket ${ticket.id} has no assigned agent`, { ticketId: ticket.id });
      return true;
    }

    let conversation = await prisma.conversation.findFirst({
      where: { agentId: ticket.agent.id },
      orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          agentId: ticket.agent.id,
          title: `Ticket: ${ticket.title}`,
        },
      });
    }

    const taskPrompt = `Process the following ticket:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}\nPriority: ${ticket.priority}\n\nPlease provide a thorough response.`;

    const result = await chatWithAgent(ticket.agent.id, conversation.id, taskPrompt);

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "done",
        output: result.message.content,
      },
    });

    await prisma.memory.create({
      data: {
        agentId: ticket.agent.id,
        type: "ticket_result",
        content: `Completed ticket "${ticket.title}": ${result.message.content.slice(0, 500)}`,
        ticketId: ticket.id,
      },
    });

    await log("info", "worker", `Ticket completed: ${ticket.title}`, { ticketId: ticket.id });
    return true;
  } catch (e: any) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "failed",
        output: `Error: ${e.message}`,
      },
    });
    await log("error", "worker", `Ticket failed: ${e.message}`, { ticketId: ticket.id });
    return true;
  }
}

async function runWorkerLoop() {
  console.log("ZEUS Worker started — polling for tickets...");
  await log("info", "worker", "Worker started");

  while (true) {
    try {
      const processed = await processNextTicket();
      if (!processed) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
    } catch (e: any) {
      console.error("Worker error:", e.message);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  }
}

runWorkerLoop();
