import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/api/dashboard", async () => {
    const [agents, tickets, skillGaps, skills, recentLogs] = await Promise.all([
      prisma.agent.count(),
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.skillGap.count({ where: { resolved: false } }),
      prisma.skill.count(),
      prisma.logEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const ticketCounts: Record<string, number> = {};
    for (const t of tickets) {
      ticketCounts[t.status] = t._count.id;
    }

    return {
      agents,
      tickets: ticketCounts,
      totalTickets: Object.values(ticketCounts).reduce((a, b) => a + b, 0),
      skillGaps,
      skills,
      recentActivity: recentLogs,
      runtimeStatus: "running",
    };
  });
}
