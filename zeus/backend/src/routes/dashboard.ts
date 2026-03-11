import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/api/dashboard", async (req) => {
    const userId = req.userId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const in7days = new Date(todayStart);
    in7days.setDate(in7days.getDate() + 7);

    const [
      agents, skills,
      todayEvents, weekEvents,
      pendingTasks, overdueTasks,
      pendingReminders, recentDone,
      upcomingTrip, nextFlight,
      pendingShoppingCount, unreadEmailCount,
    ] = await Promise.all([
      prisma.agent.count({ where: { enabled: true, OR: [{ userId }, { userId: null }] } }),
      prisma.skill.count(),
      prisma.calendarEvent.findMany({
        where: { userId, startAt: { gte: todayStart, lt: todayEnd } },
        orderBy: { startAt: "asc" }, take: 5,
      }),
      prisma.calendarEvent.findMany({
        where: { userId, startAt: { gte: todayStart, lt: weekEnd } },
        orderBy: { startAt: "asc" }, take: 10,
      }),
      prisma.ticket.findMany({
        where: { userId, status: { in: ["queued", "in_progress"] } },
        include: { agent: { select: { name: true } } },
        orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
        take: 8,
      }),
      prisma.ticket.findMany({
        where: { userId, status: { in: ["queued", "in_progress"] }, dueAt: { lt: now } },
        orderBy: { dueAt: "asc" }, take: 5,
      }),
      prisma.reminder.findMany({
        where: { userId, status: "pending", dueAt: { gte: todayStart, lt: todayEnd } },
        orderBy: { dueAt: "asc" },
      }),
      prisma.ticket.findMany({
        where: { userId, status: "done", updatedAt: { gte: todayStart } },
        orderBy: { updatedAt: "desc" }, take: 5,
      }),
      // Next upcoming trip
      prisma.trip.findFirst({
        where: { userId, startDate: { gte: todayStart }, status: { not: "past" } },
        orderBy: { startDate: "asc" },
        select: { id: true, name: true, destination: true, startDate: true, coverEmoji: true },
      }),
      // Next tracked flight within 7 days
      prisma.tripEvent.findFirst({
        where: {
          trip: { userId },
          type: "flight",
          startTime: { gte: now, lt: in7days },
        },
        orderBy: { startTime: "asc" },
        select: { id: true, title: true, flightNumber: true, airline: true, fromAirport: true, toAirport: true, startTime: true, flightStatus: true, delayMinutes: true },
      }),
      // Pending shopping items count
      prisma.shoppingItem.count({ where: { userId, status: "pending" } }),
      // Unread emails count
      prisma.emailMessage.count({ where: { direction: "inbound", isRead: false } }),
    ]);

    return {
      agents, skills, runtimeStatus: "running",
      todayEvents, weekEvents,
      pendingTasks, overdueTasks,
      pendingReminders, recentDone,
      upcomingTrip,
      nextFlight,
      pendingShoppingCount,
      unreadEmailCount,
    };
  });
}
