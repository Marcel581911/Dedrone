import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { log } from "../logger.js";

// ── Calendar sync helper ──────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  flight: "#3b82f6", hotel: "#8b5cf6", activity: "#10b981",
  transport: "#f59e0b", car_rental: "#f59e0b",
};
const EVENT_ICONS: Record<string, string> = {
  flight: "✈️", hotel: "🏨", activity: "🎯", transport: "🚗", car_rental: "🚗",
};

async function syncEventToCalendar(event: any, userId: string, tripName: string) {
  const icon = EVENT_ICONS[event.type] || "📍";
  let title = `${icon} ${event.title}`;
  if (event.type === "flight" && event.flightNumber) {
    title = `${icon} ${[event.airline, event.flightNumber].filter(Boolean).join(" ")}`;
    if (event.fromAirport && event.toAirport) title += ` ${event.fromAirport}→${event.toAirport}`;
  }
  const desc = [
    tripName,
    event.bookingRef ? `Ref: ${event.bookingRef}` : "",
    event.confirmationNum ? `Conf: ${event.confirmationNum}` : "",
    event.notes,
  ].filter(Boolean).join(" · ");

  const existing = await prisma.calendarEvent.findFirst({
    where: { source: "travel", sourceId: event.id },
  });
  if (existing) {
    await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: {
        title,
        description: desc,
        startAt: event.startTime,
        endAt: event.endTime ?? null,
        location: event.location || event.address || "",
        color: EVENT_COLORS[event.type] || "#6b7280",
      },
    });
  } else {
    await prisma.calendarEvent.create({
      data: {
        title,
        description: desc,
        startAt: event.startTime,
        endAt: event.endTime ?? null,
        location: event.location || event.address || "",
        source: "travel",
        sourceId: event.id,
        color: EVENT_COLORS[event.type] || "#6b7280",
        userId,
      },
    });
  }
}

async function removeEventFromCalendar(eventId: string) {
  await prisma.calendarEvent.deleteMany({ where: { source: "travel", sourceId: eventId } });
}

export async function travelRoutes(app: FastifyInstance) {
  // ── TRIPS ─────────────────────────────────────────────────────────────────

  // List user's trips
  app.get("/api/travel/trips", async (req) => {
    const q = req.query as any;
    const where: any = { userId: req.userId };
    if (q.status) where.status = q.status;

    const trips = await prisma.trip.findMany({
      where,
      include: { _count: { select: { events: true } } },
      orderBy: { startDate: "desc" },
    });

    return trips;
  });

  // Create trip
  app.post("/api/travel/trips", async (req) => {
    const { name, destination, homeAirport, startDate, endDate, coverEmoji, notes } = req.body as any;
    if (!name?.trim()) throw new Error("Name is required");
    if (!destination?.trim()) throw new Error("Destination is required");
    if (!startDate) throw new Error("startDate is required");
    if (!endDate) throw new Error("endDate is required");

    const trip = await prisma.trip.create({
      data: {
        userId: req.userId,
        name: name.trim(),
        destination: destination.trim(),
        homeAirport: homeAirport || "SFO",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "upcoming",
        coverEmoji: coverEmoji || null,
        notes: notes || "",
      },
    });

    await log("info", "travel", `Trip created: ${trip.name}`, { userId: req.userId });
    return trip;
  });

  // Get single trip with events
  app.get("/api/travel/trips/:id", async (req, reply) => {
    const { id } = req.params as any;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        events: { orderBy: { startTime: "asc" }, include: { tracking: true } },
        pois: true,
      },
    });

    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    return trip;
  });

  // Update trip
  app.put("/api/travel/trips/:id", async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.destination !== undefined && { destination: body.destination }),
        ...(body.homeAirport !== undefined && { homeAirport: body.homeAirport }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.coverEmoji !== undefined && { coverEmoji: body.coverEmoji }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return updated;
  });

  // Delete trip (cascade events via Prisma relation)
  app.delete("/api/travel/trips/:id", async (req, reply) => {
    const { id } = req.params as any;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    // Delete tracking, then events, then POIs, then trip
    const events = await prisma.tripEvent.findMany({ where: { tripId: id }, select: { id: true } });
    const eventIds = events.map((e) => e.id);

    await prisma.flightTracking.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.calendarEvent.deleteMany({ where: { source: "travel", sourceId: { in: eventIds } } });
    await prisma.tripEvent.deleteMany({ where: { tripId: id } });
    await prisma.pOI.deleteMany({ where: { tripId: id } });
    await prisma.trip.delete({ where: { id } });

    await log("info", "travel", `Trip deleted: ${trip.name}`, { userId: req.userId });
    return { success: true };
  });

  // ── EVENTS ────────────────────────────────────────────────────────────────

  // Add event to trip
  app.post("/api/travel/trips/:id/events", async (req, reply) => {
    const { id: tripId } = req.params as any;
    const body = req.body as any;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    if (!body.type) throw new Error("type is required");
    if (!body.title) throw new Error("title is required");
    if (!body.startTime) throw new Error("startTime is required");

    const event = await prisma.tripEvent.create({
      data: {
        tripId,
        type: body.type,
        title: body.title,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        location: body.location || "",
        address: body.address || "",
        bookingRef: body.bookingRef || "",
        confirmationNum: body.confirmationNum || "",
        notes: body.notes || "",
        flightNumber: body.flightNumber || "",
        airline: body.airline || "",
        fromAirport: body.fromAirport || "",
        toAirport: body.toAirport || "",
        terminal: body.terminal || "",
        gate: body.gate || "",
        flightStatus: body.flightStatus || "scheduled",
        delayMinutes: body.delayMinutes || 0,
      },
    });

    syncEventToCalendar(event, req.userId, trip.name).catch(() => {});
    return event;
  });

  // Update event
  app.put("/api/travel/trips/:id/events/:eventId", async (req, reply) => {
    const { id: tripId, eventId } = req.params as any;
    const body = req.body as any;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
    if (!event || event.tripId !== tripId) return reply.status(404).send({ error: "Event not found" });

    const updated = await prisma.tripEvent.update({
      where: { id: eventId },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
        ...(body.endTime !== undefined && { endTime: body.endTime ? new Date(body.endTime) : null }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.bookingRef !== undefined && { bookingRef: body.bookingRef }),
        ...(body.confirmationNum !== undefined && { confirmationNum: body.confirmationNum }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.flightNumber !== undefined && { flightNumber: body.flightNumber }),
        ...(body.airline !== undefined && { airline: body.airline }),
        ...(body.fromAirport !== undefined && { fromAirport: body.fromAirport }),
        ...(body.toAirport !== undefined && { toAirport: body.toAirport }),
        ...(body.terminal !== undefined && { terminal: body.terminal }),
        ...(body.gate !== undefined && { gate: body.gate }),
        ...(body.flightStatus !== undefined && { flightStatus: body.flightStatus }),
        ...(body.delayMinutes !== undefined && { delayMinutes: body.delayMinutes }),
      },
    });

    syncEventToCalendar(updated, req.userId, trip.name).catch(() => {});
    return updated;
  });

  // Delete event
  app.delete("/api/travel/trips/:id/events/:eventId", async (req, reply) => {
    const { id: tripId, eventId } = req.params as any;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
    if (!event || event.tripId !== tripId) return reply.status(404).send({ error: "Event not found" });

    await prisma.flightTracking.deleteMany({ where: { eventId } });
    await prisma.tripEvent.delete({ where: { id: eventId } });
    removeEventFromCalendar(eventId).catch(() => {});

    return { success: true };
  });

  // ── FLIGHT TRACKING ───────────────────────────────────────────────────────

  // Enable tracking
  app.post("/api/travel/trips/:id/events/:eventId/track", async (req, reply) => {
    const { id: tripId, eventId } = req.params as any;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
    if (!event || event.tripId !== tripId) return reply.status(404).send({ error: "Event not found" });

    // Upsert tracking record
    const tracking = await prisma.flightTracking.upsert({
      where: { eventId },
      create: {
        eventId,
        userId: req.userId,
        active: true,
        lastStatus: event.flightStatus || "scheduled",
      },
      update: {
        active: true,
        userId: req.userId,
      },
    });

    // Optionally subscribe via flight-tracker service
    try {
      const { subscribeToFlight } = await import("../services/flight-tracker.js");
      const { subscriptionId } = await subscribeToFlight(eventId, req.userId);
      if (subscriptionId) {
        await prisma.flightTracking.update({
          where: { eventId },
          data: { subscriptionId },
        });
        tracking.subscriptionId = subscriptionId;
      }
    } catch (e: any) {
      await log("warn", "travel", `Flight subscription failed for event ${eventId}: ${e.message}`);
    }

    return { success: true, tracking };
  });

  // Disable tracking
  app.delete("/api/travel/trips/:id/events/:eventId/track", async (req, reply) => {
    const { id: tripId, eventId } = req.params as any;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
    if (!event || event.tripId !== tripId) return reply.status(404).send({ error: "Event not found" });

    const existing = await prisma.flightTracking.findUnique({ where: { eventId } });
    if (existing) {
      await prisma.flightTracking.update({
        where: { eventId },
        data: { active: false },
      });
    }

    return { success: true };
  });

  // Manual flight status check
  app.post("/api/travel/trips/:id/events/:eventId/check", async (req, reply) => {
    const { id: tripId, eventId } = req.params as any;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return reply.status(404).send({ error: "Trip not found" });
    if (trip.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
    if (!event || event.tripId !== tripId) return reply.status(404).send({ error: "Event not found" });

    const { checkFlightStatus } = await import("../services/flight-tracker.js");
    const result = await checkFlightStatus(eventId, req.userId);

    const updatedEvent = await prisma.tripEvent.findUnique({ where: { id: eventId } });

    return { ...result, event: updatedEvent };
  });

  // ── EMAIL INGESTION ───────────────────────────────────────────────────────

  app.post("/api/travel/ingest", async (_req) => {
    const { parseEmailsForTrips } = await import("../services/trip-email-parser.js");
    const result = await parseEmailsForTrips(_req.userId);
    return result;
  });

  // ── POIS ──────────────────────────────────────────────────────────────────

  // List POIs
  app.get("/api/travel/pois", async (req) => {
    const q = req.query as any;
    const where: any = { userId: req.userId };
    if (q.country) where.country = q.country;
    if (q.city) where.city = q.city;
    if (q.category) where.category = q.category;
    if (q.tripId) where.tripId = q.tripId;

    const pois = await prisma.pOI.findMany({
      where,
      orderBy: { visitedAt: "desc" },
    });

    return pois;
  });

  // Create POI
  app.post("/api/travel/pois", async (req) => {
    const body = req.body as any;
    if (!body.name?.trim()) throw new Error("name is required");

    const poi = await prisma.pOI.create({
      data: {
        userId: req.userId,
        tripId: body.tripId || null,
        name: body.name.trim(),
        address: body.address || "",
        city: body.city || "",
        country: body.country || "",
        category: body.category || "",
        notes: body.notes || "",
        visitedAt: body.visitedAt ? new Date(body.visitedAt) : null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
      },
    });

    return poi;
  });

  // Update POI
  app.put("/api/travel/pois/:id", async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;

    const poi = await prisma.pOI.findUnique({ where: { id } });
    if (!poi) return reply.status(404).send({ error: "POI not found" });
    if (poi.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    const updated = await prisma.pOI.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.visitedAt !== undefined && { visitedAt: body.visitedAt ? new Date(body.visitedAt) : null }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        ...(body.tripId !== undefined && { tripId: body.tripId || null }),
      },
    });

    return updated;
  });

  // Delete POI
  app.delete("/api/travel/pois/:id", async (req, reply) => {
    const { id } = req.params as any;

    const poi = await prisma.pOI.findUnique({ where: { id } });
    if (!poi) return reply.status(404).send({ error: "POI not found" });
    if (poi.userId !== req.userId) return reply.status(403).send({ error: "Forbidden" });

    await prisma.pOI.delete({ where: { id } });
    return { success: true };
  });

  // Bulk import POIs from JSON array or CSV text
  app.post("/api/travel/pois/import", async (req) => {
    const body = req.body as any;

    let items: any[] = [];

    // Accept direct array
    if (Array.isArray(body)) {
      items = body;
    } else if (Array.isArray(body?.pois)) {
      items = body.pois;
    } else if (typeof body?.data === "string") {
      // CSV: name,city,country,category,notes,visitedAt
      const lines = body.data.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c: string) => c.trim());
        const row: any = {};
        headers.forEach((h: string, idx: number) => {
          row[h] = cols[idx] || "";
        });
        items.push(row);
      }
    }

    let created = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        if (!item.name) continue;
        await prisma.pOI.create({
          data: {
            userId: req.userId,
            tripId: item.tripId || null,
            name: item.name,
            address: item.address || "",
            city: item.city || "",
            country: item.country || "",
            category: item.category || "",
            notes: item.notes || "",
            visitedAt: item.visitedAt ? new Date(item.visitedAt) : null,
            lat: item.lat ? parseFloat(item.lat) : null,
            lng: item.lng ? parseFloat(item.lng) : null,
          },
        });
        created++;
      } catch (e: any) {
        errors.push(`${item.name}: ${e.message}`);
      }
    }

    return { created, errors: errors.length > 0 ? errors : undefined };
  });

  // ── CALENDAR ──────────────────────────────────────────────────────────────

  app.get("/api/travel/calendar", async (req) => {
    const q = req.query as any;
    const from = q.from ? new Date(q.from) : new Date(new Date().setDate(1));
    const to = q.to ? new Date(q.to) : new Date(new Date().setMonth(new Date().getMonth() + 1));

    // Find all trips belonging to this user
    const trips = await prisma.trip.findMany({
      where: { userId: req.userId },
      select: { id: true, name: true, coverEmoji: true },
    });

    const tripIds = trips.map((t) => t.id);
    const tripMap = new Map(trips.map((t) => [t.id, { name: t.name, coverEmoji: t.coverEmoji }]));

    const events = await prisma.tripEvent.findMany({
      where: {
        tripId: { in: tripIds },
        startTime: { gte: from, lte: to },
      },
      orderBy: { startTime: "asc" },
    });

    const result = events.map((e) => {
      const meta = tripMap.get(e.tripId) || { name: "", coverEmoji: null };
      return {
        ...e,
        tripName: meta.name,
        tripEmoji: meta.coverEmoji,
      };
    });

    return result;
  });

  // ── UPLOAD ────────────────────────────────────────────────────────────────

  app.post("/api/travel/upload", async (req, reply) => {
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    let tripsData: any[] = [];
    let poisData: any[] = [];

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart file upload
      const data = await (req as any).file();
      if (!data) return reply.status(400).send({ error: "No file uploaded" });

      const buffers: Buffer[] = [];
      for await (const chunk of data.file) {
        buffers.push(chunk);
      }
      const rawText = Buffer.concat(buffers).toString("utf-8");
      const filename: string = data.filename || "";

      if (filename.endsWith(".json") || contentType.includes("json")) {
        const parsed = JSON.parse(rawText);
        tripsData = parsed.trips || [];
        poisData = parsed.pois || [];
      } else if (filename.endsWith(".csv")) {
        // CSV not well-defined for trips; treat as POIs
        const lines = rawText.split("\n").map((l: string) => l.trim()).filter(Boolean);
        const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c: string) => c.trim());
          const row: any = {};
          headers.forEach((h: string, idx: number) => {
            row[h] = cols[idx] || "";
          });
          poisData.push(row);
        }
      } else {
        // Try JSON anyway
        try {
          const parsed = JSON.parse(rawText);
          tripsData = parsed.trips || [];
          poisData = parsed.pois || [];
        } catch {
          return reply.status(400).send({ error: "Unsupported file format" });
        }
      }
    } else {
      // JSON body
      const body = req.body as any;
      if (typeof body === "string") {
        try {
          const parsed = JSON.parse(body);
          tripsData = parsed.trips || [];
          poisData = parsed.pois || [];
        } catch {
          return reply.status(400).send({ error: "Invalid JSON" });
        }
      } else {
        tripsData = body?.trips || [];
        poisData = body?.pois || [];
      }
    }

    let tripsCreated = 0;
    let eventsCreated = 0;
    let poisCreated = 0;

    for (const tripData of tripsData) {
      try {
        const trip = await prisma.trip.create({
          data: {
            userId: req.userId,
            name: tripData.name || "Imported Trip",
            destination: tripData.destination || "",
            homeAirport: tripData.homeAirport || "SFO",
            startDate: tripData.startDate ? new Date(tripData.startDate) : new Date(),
            endDate: tripData.endDate ? new Date(tripData.endDate) : new Date(),
            status: tripData.status || "upcoming",
            coverEmoji: tripData.coverEmoji || null,
            notes: tripData.notes || "",
          },
        });
        tripsCreated++;

        const events: any[] = tripData.events || [];
        for (const ev of events) {
          try {
            if (!ev.startTime) continue;
            await prisma.tripEvent.create({
              data: {
                tripId: trip.id,
                type: ev.type || "activity",
                title: ev.title || "Event",
                startTime: new Date(ev.startTime),
                endTime: ev.endTime ? new Date(ev.endTime) : null,
                location: ev.location || "",
                address: ev.address || "",
                bookingRef: ev.bookingRef || "",
                confirmationNum: ev.confirmationNum || "",
                notes: ev.notes || "",
                flightNumber: ev.flightNumber || "",
                airline: ev.airline || "",
                fromAirport: ev.fromAirport || "",
                toAirport: ev.toAirport || "",
                terminal: ev.terminal || "",
                gate: ev.gate || "",
                flightStatus: ev.flightStatus || "scheduled",
                delayMinutes: ev.delayMinutes || 0,
              },
            });
            eventsCreated++;
          } catch {}
        }

        const tripPois: any[] = tripData.pois || [];
        for (const p of tripPois) {
          try {
            if (!p.name) continue;
            await prisma.pOI.create({
              data: {
                userId: req.userId,
                tripId: trip.id,
                name: p.name,
                address: p.address || "",
                city: p.city || tripData.destination || "",
                country: p.country || "",
                category: p.category || "",
                notes: p.notes || "",
                visitedAt: p.visitedAt ? new Date(p.visitedAt) : null,
                lat: p.lat ?? null,
                lng: p.lng ?? null,
              },
            });
            poisCreated++;
          } catch {}
        }
      } catch (e: any) {
        await log("warn", "travel", `Failed to import trip "${tripData.name}": ${e.message}`);
      }
    }

    for (const p of poisData) {
      try {
        if (!p.name) continue;
        await prisma.pOI.create({
          data: {
            userId: req.userId,
            tripId: p.tripId || null,
            name: p.name,
            address: p.address || "",
            city: p.city || "",
            country: p.country || "",
            category: p.category || "",
            notes: p.notes || "",
            visitedAt: p.visitedAt ? new Date(p.visitedAt) : null,
            lat: p.lat ? parseFloat(p.lat) : null,
            lng: p.lng ? parseFloat(p.lng) : null,
          },
        });
        poisCreated++;
      } catch {}
    }

    await log(
      "info",
      "travel",
      `Upload import: ${tripsCreated} trips, ${eventsCreated} events, ${poisCreated} POIs`,
      { userId: req.userId }
    );

    return { tripsCreated, eventsCreated, poisCreated };
  });
}
