import { prisma } from "../db.js";
import { log } from "../logger.js";
import { checkSkillRateLimit, MAX_AGENTS_PER_USER } from "./guardrail.js";

export interface SkillResult {
  success: boolean;
  data: Record<string, unknown>;
  message: string;
}

type SkillHandler = (args: Record<string, unknown>, userId: string) => Promise<SkillResult>;

const BUILTIN_SKILLS: Record<string, SkillHandler> = {
  create_ticket: async (args, userId) => {
    const title = String(args.title || "Untitled");
    const description = String(args.description || "");
    const priority = String(args.priority || "medium");
    const category = String(args.category || "Personal");
    const agentId = args.agentId ? String(args.agentId) : null;
    const dueAt = args.dueAt ? new Date(String(args.dueAt)) : null;

    const recurring = args.recurring ? String(args.recurring) : "";
    const ticket = await prisma.ticket.create({
      data: { title, description, priority, category, status: "queued", agentId, output: "", dueAt, recurring, userId: userId || null },
    });

    await log("info", "skill:create_ticket", `Task created: "${title}" [${ticket.id}]`, { ticketId: ticket.id, priority });
    const dueStr = dueAt ? `, due ${dueAt.toLocaleDateString()}` : "";
    return {
      success: true,
      data: { ticketId: ticket.id, title, priority, category, status: "queued" },
      message: `Task "${title}" created (${category}, priority: ${priority}${dueStr}).`,
    };
  },

  assign_ticket: async (args) => {
    const ticketId = String(args.ticketId || "");
    const agentId = String(args.agentId || "");
    if (!ticketId || !agentId) return { success: false, data: {}, message: "Both ticketId and agentId are required." };

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, data: {}, message: `Ticket ${ticketId} not found.` };

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, data: {}, message: `Agent ${agentId} not found.` };

    await prisma.ticket.update({ where: { id: ticketId }, data: { agentId } });
    await log("info", "skill:assign_ticket", `Ticket "${ticket.title}" assigned to ${agent.name}`, { ticketId, agentId });
    return { success: true, data: { ticketId, agentId, agentName: agent.name }, message: `Ticket "${ticket.title}" assigned to "${agent.name}".` };
  },

  summarize_text: async (args) => {
    const text = String(args.text || "");
    if (!text) return { success: false, data: {}, message: "No text provided." };
    return { success: true, data: { inputLength: text.length }, message: `Received ${text.length} characters. Produce the summary in your response.` };
  },

  list_agents: async (_args, userId) => {
    const agents = await prisma.agent.findMany({
      where: { enabled: true, OR: [{ userId }, { userId: null }] },
      select: { id: true, name: true, role: true, mission: true },
    });
    return {
      success: true,
      data: { agents },
      message: `Available agents:\n${agents.map((a) => `  - ${a.name} (ID: ${a.id}, role: ${a.role})`).join("\n")}`,
    };
  },

  read_emails: async (args, _userId) => {
    const limit = Number(args.limit) || 10;
    const unreadOnly = args.unreadOnly !== false;
    const where: any = { direction: "inbound" };
    if (unreadOnly) where.isRead = false;
    const emails = await prisma.emailMessage.findMany({ where, orderBy: { date: "desc" }, take: limit });
    if (emails.length === 0) return { success: true, data: { emails: [] }, message: "No emails found." };
    const summaries = emails.map((e) => `  - From: ${e.from}\n    Subject: ${e.subject}\n    Date: ${e.date.toISOString().slice(0, 16)}\n    Preview: ${e.body.slice(0, 120)}...`);
    return {
      success: true,
      data: { emails: emails.map((e) => ({ id: e.id, from: e.from, subject: e.subject, date: e.date, body: e.body.slice(0, 500) })) },
      message: `${emails.length} email(s):\n${summaries.join("\n\n")}`,
    };
  },

  send_email: async (args) => {
    const { sendEmail } = await import("./email.js");
    const to = String(args.to || "");
    const subject = String(args.subject || "");
    const body = String(args.body || "");
    if (!to || !subject) return { success: false, data: {}, message: "'to' and 'subject' are required." };
    try {
      const messageId = await sendEmail(to, subject, body);
      return { success: true, data: { messageId }, message: `Email sent to ${to}: "${subject}"` };
    } catch (e: any) {
      return { success: false, data: {}, message: `Failed to send email: ${e.message}` };
    }
  },

  create_automation: async (args, userId) => {
    const automation = await prisma.automation.create({
      data: {
        userId,
        what: String(args.what || ""), systems: String(args.systems || ""),
        frequency: String(args.frequency || ""), dataSource: String(args.dataSource || ""),
        delivery: String(args.delivery || ""), status: "pending",
      },
    });
    return { success: true, data: { automationId: automation.id }, message: `Automation created: "${automation.what}" (ID: ${automation.id}).` };
  },

  set_reminder: async (args, userId) => {
    const title = String(args.title || "");
    const dueAt = String(args.dueAt || "");
    const recurring = String(args.recurring || "");
    if (!title || !dueAt) return { success: false, data: {}, message: "Title and dueAt are required." };
    const date = new Date(dueAt);
    if (isNaN(date.getTime())) return { success: false, data: {}, message: "Invalid date format. Use ISO format." };
    const reminder = await prisma.reminder.create({ data: { title, dueAt: date, recurring, userId: userId || null } });
    return { success: true, data: { reminderId: reminder.id }, message: `Reminder set: "${title}" for ${date.toLocaleString()}${recurring ? ` (${recurring})` : ""}` };
  },

  add_calendar_event: async (args, userId) => {
    const title = String(args.title || "");
    const startAt = String(args.startAt || "");
    if (!title || !startAt) return { success: false, data: {}, message: "Title and startAt are required." };
    const start = new Date(startAt);
    if (isNaN(start.getTime())) return { success: false, data: {}, message: "Invalid date format." };
    const event = await prisma.calendarEvent.create({
      data: {
        title, startAt: start,
        endAt: args.endAt ? new Date(String(args.endAt)) : null,
        location: String(args.location || ""),
        allDay: Boolean(args.allDay),
        description: String(args.description || ""),
        source: "assistant",
        userId: userId || null,
      },
    });
    return { success: true, data: { eventId: event.id }, message: `Event "${title}" added to calendar on ${start.toLocaleDateString()}` };
  },

  save_note: async (args, userId) => {
    const content = String(args.content || "");
    if (!content) return { success: false, data: {}, message: "Content is required." };
    const note = await prisma.note.create({
      data: { title: String(args.title || ""), content, pinned: Boolean(args.pinned), userId: userId || null },
    });
    return { success: true, data: { noteId: note.id }, message: `Note saved${args.title ? `: "${args.title}"` : ""}.` };
  },

  create_agent: async (args, userId) => {
    const name = String(args.name || "");
    const role = String(args.role || "");
    const mission = String(args.mission || "");
    if (!name) return { success: false, data: {}, message: "Agent name is required." };

    const count = await prisma.agent.count({ where: { userId } });
    if (count >= MAX_AGENTS_PER_USER) return { success: false, data: {}, message: `Maximum ${MAX_AGENTS_PER_USER} agents per user. Log a support ticket to request an increase.` };

    const existing = await prisma.agent.findFirst({ where: { name, userId } });
    if (existing) return { success: false, data: {}, message: `Agent "${name}" already exists.` };

    const agent = await prisma.agent.create({
      data: {
        name, description: String(args.description || ""), role, mission,
        systemPrompt: String(args.systemPrompt || `You are ${name}, a ${role}. Your mission: ${mission}.`),
        model: "gpt-4o-mini", temperature: 0.7, maxTokens: 2048, enabled: true,
        tags: JSON.stringify([role.toLowerCase().replace(/\s+/g, "-")]),
        userId: userId || null,
      },
    });

    await log("info", "skill:create_agent", `Agent "${name}" created`, { agentId: agent.id });
    return { success: true, data: { agentId: agent.id, name }, message: `Agent "${name}" created (ID: ${agent.id}).` };
  },

  manage_agent: async (args) => {
    const agentId = String(args.agentId || "");
    const action = String(args.action || "");
    if (!agentId || !action) return { success: false, data: {}, message: "agentId and action are required." };
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return { success: false, data: {}, message: `Agent ${agentId} not found.` };
    if (agent.isSystem) return { success: false, data: {}, message: "Cannot modify the System agent." };
    const enabled = action === "enable";
    await prisma.agent.update({ where: { id: agentId }, data: { enabled } });
    return { success: true, data: { agentId, enabled }, message: `Agent "${agent.name}" ${enabled ? "enabled" : "disabled"}.` };
  },

  send_alert: async (args, userId) => {
    const message = String(args.message || "");
    if (!message) return { success: false, data: {}, message: "message is required." };
    const { sendAlert } = await import("./alerts.js");
    const result = await sendAlert(userId, message);
    const sent = result.telegram || result.sms;
    return {
      success: sent,
      data: result,
      message: sent
        ? `Alert sent (Telegram: ${result.telegram}, SMS: ${result.sms}).`
        : "No alert channels configured. Set up Telegram or SMS in Settings → Profile.",
    };
  },

  get_net_worth: async (_args, userId) => {
    const [accounts, assets, stocks, debts] = await Promise.all([
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.stockHolding.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId } }),
    ]);
    const cash = accounts.reduce((s, a) => s + a.balance, 0);
    const assetVal = assets.reduce((s, a) => s + a.value, 0);
    const stockCost = stocks.reduce((s, h) => s + h.shares * h.avgCost, 0);
    const totalAssets = cash + assetVal + stockCost;
    const totalLiabilities = debts.reduce((s, d) => s + d.balance, 0);
    const netWorth = totalAssets - totalLiabilities;
    const fmt = (n: number) => n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return {
      success: true,
      data: { netWorth, totalAssets, totalLiabilities, cash, assetVal, stockCost },
      message: `Net worth: ${fmt(netWorth)}\nTotal assets: ${fmt(totalAssets)} (Cash: ${fmt(cash)}, Investments: ${fmt(stockCost)}, Other assets: ${fmt(assetVal)})\nTotal liabilities: ${fmt(totalLiabilities)}`,
    };
  },

  get_portfolio_value: async (_args, userId) => {
    const holdings = await prisma.stockHolding.findMany({ where: { userId } });
    if (holdings.length === 0) return { success: true, data: {}, message: "No stock or crypto holdings found." };
    const { fetchQuotes } = await import("./stock-prices.js");
    const tickers = [...new Set(holdings.map(h => h.ticker))];
    const quotes = await fetchQuotes(tickers);
    let totalValue = 0, totalCost = 0;
    const lines: string[] = [];
    for (const h of holdings) {
      const q = quotes[h.ticker];
      const currentPrice = q?.price || h.avgCost;
      const value = h.shares * currentPrice;
      const cost = h.shares * h.avgCost;
      const pnl = value - cost;
      totalValue += value;
      totalCost += cost;
      const pnlStr = pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2);
      lines.push(`${h.ticker}: ${h.shares} shares @ ${currentPrice.toFixed(2)} = ${value.toFixed(2)} ${h.currency} (P&L: ${pnlStr})`);
    }
    const totalPnl = totalValue - totalCost;
    return {
      success: true,
      data: { totalValue, totalCost, totalPnl, holdings: lines },
      message: `Portfolio value: ${totalValue.toFixed(2)}\nTotal P&L: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}\n\n${lines.join("\n")}`,
    };
  },

  get_spending_summary: async (args, userId) => {
    const months = parseInt(String(args.months || "1"));
    const from = new Date();
    from.setMonth(from.getMonth() - months + 1);
    from.setDate(1); from.setHours(0, 0, 0, 0);
    const txs = await prisma.transaction.findMany({
      where: { userId, amount: { lt: 0 }, date: { gte: from } },
    });
    const byCategory: Record<string, number> = {};
    for (const tx of txs) {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + Math.abs(tx.amount);
    }
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const lines = sorted.map(([cat, amt]) => `  ${cat}: ${amt.toFixed(2)} (${((amt/total)*100).toFixed(1)}%)`);
    return {
      success: true,
      data: { byCategory, total },
      message: `Spending last ${months} month(s): ${total.toFixed(2)}\n${lines.join("\n")}`,
    };
  },

  add_asset: async (args, userId) => {
    const name = String(args.name || "");
    const type = String(args.type || "other");
    const value = parseFloat(String(args.value || "0"));
    if (!name) return { success: false, data: {}, message: "Asset name is required." };
    const asset = await prisma.asset.create({
      data: { userId, name, type, value, currency: String(args.currency || "EUR"), purchasePrice: parseFloat(String(args.purchasePrice || "0")), notes: String(args.notes || "") },
    });
    return { success: true, data: { assetId: asset.id }, message: `Asset "${name}" (${type}) added with value ${value}.` };
  },

  add_debt: async (args, userId) => {
    const name = String(args.name || "");
    const balance = parseFloat(String(args.balance || "0"));
    if (!name) return { success: false, data: {}, message: "Debt name is required." };
    const debt = await prisma.debt.create({
      data: {
        userId, name, type: String(args.type || "other"), balance,
        originalAmount: parseFloat(String(args.originalAmount || "0")) || balance,
        interestRate: parseFloat(String(args.interestRate || "0")),
        monthlyPayment: parseFloat(String(args.monthlyPayment || "0")),
        currency: String(args.currency || "EUR"),
        notes: String(args.notes || ""),
      },
    });
    return { success: true, data: { debtId: debt.id }, message: `Debt "${name}" added: ${balance} at ${debt.interestRate}% APR.` };
  },

  add_to_shopping_list: async (args, userId) => {
    const item = await prisma.shoppingItem.create({
      data: {
        userId,
        shopId: args.shopId ? String(args.shopId) : null,
        name: String(args.name || ""),
        quantity: String(args.quantity || "1"),
        category: String(args.category || ""),
        notes: String(args.notes || ""),
        priority: String(args.priority || "normal"),
        addedBy: "agent",
      },
      include: { shop: { select: { name: true } } },
    });
    return {
      success: true,
      data: { id: item.id, name: item.name, quantity: item.quantity, shop: (item as any).shop?.name || "General" },
      message: `Added "${item.name}" (qty: ${item.quantity}) to ${(item as any).shop?.name || "General"} shopping list.`,
    };
  },

  get_shopping_list: async (args, userId) => {
    const where: any = { userId, status: String(args.status || "pending") };
    if (args.shopId) where.shopId = String(args.shopId);
    const items = await prisma.shoppingItem.findMany({
      where,
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const mapped = items.map((i) => ({
      id: i.id, name: i.name, quantity: i.quantity,
      shop: (i as any).shop?.name || "General", category: i.category, priority: i.priority,
    }));
    return {
      success: true,
      data: { items: mapped },
      message: items.length === 0
        ? "Shopping list is empty."
        : `Shopping list (${items.length} item${items.length > 1 ? "s" : ""}):\n${mapped.map((i) => `  - ${i.name} x${i.quantity} [${i.shop}]`).join("\n")}`,
    };
  },

  create_price_alert: async (args, userId) => {
    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        productName: String(args.productName || ""),
        productUrl: String(args.productUrl || ""),
        targetPrice: parseFloat(String(args.targetPrice || "0")),
      },
    });
    return {
      success: true,
      data: { alertId: alert.id },
      message: `Price alert set for "${alert.productName}" at ${alert.targetPrice}. I'll notify you when the price drops.`,
    };
  },

  // ── Travel skills ──────────────────────────────────────────────────────────

  get_upcoming_trip: async (_args, userId) => {
    const trip = await prisma.trip.findFirst({
      where: { userId, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      include: { events: { orderBy: { startTime: "asc" } } },
    });
    if (!trip) return { success: true, data: {}, message: "No upcoming trips planned." };
    const deptFlight = trip.events.find((e: any) => e.type === "flight" && e.fromAirport === trip.homeAirport);
    const retFlight = trip.events.find((e: any) => e.type === "flight" && e.toAirport === trip.homeAirport);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return {
      success: true,
      data: { tripId: trip.id, name: trip.name, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate },
      message: `Next trip: "${trip.name}" to ${trip.destination}\n` +
        `Dates: ${fmt(trip.startDate)} – ${fmt(trip.endDate)}\n` +
        (deptFlight ? `Outbound: ${deptFlight.airline} ${deptFlight.flightNumber} on ${fmt(new Date(deptFlight.startTime))} | Status: ${deptFlight.flightStatus}\n` : "") +
        (retFlight ? `Return: ${retFlight.airline} ${retFlight.flightNumber} on ${fmt(new Date(retFlight.startTime))}\n` : "") +
        `${trip.events.length} event(s) in itinerary`,
    };
  },

  create_trip: async (args, userId) => {
    const name = String(args.name || "");
    if (!name) return { success: false, data: {}, message: "Trip name is required." };
    const startDate = new Date(String(args.startDate || new Date().toISOString()));
    const endDate = new Date(String(args.endDate || args.startDate || new Date().toISOString()));
    if (isNaN(startDate.getTime())) return { success: false, data: {}, message: "Invalid startDate. Use ISO format (YYYY-MM-DD)." };
    const trip = await prisma.trip.create({
      data: {
        userId,
        name,
        destination: String(args.destination || ""),
        homeAirport: String(args.homeAirport || "SFO"),
        startDate,
        endDate: isNaN(endDate.getTime()) ? startDate : endDate,
        notes: String(args.notes || ""),
      },
    });
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return {
      success: true,
      data: { tripId: trip.id },
      message: `Trip "${name}" to ${trip.destination} created (${fmt(trip.startDate)} – ${fmt(trip.endDate)}). Add events with add_trip_event.`,
    };
  },

  add_trip_event: async (args, userId) => {
    let tripId = String(args.tripId || "");
    if (!tripId) {
      const tripName = String(args.tripName || "");
      if (!tripName) return { success: false, data: {}, message: "Provide tripId or tripName to identify the trip." };
      const trip = await prisma.trip.findFirst({ where: { userId, name: { contains: tripName } }, orderBy: { startDate: "asc" } });
      if (!trip) return { success: false, data: {}, message: `No trip found matching "${tripName}". Create the trip first.` };
      tripId = trip.id;
    }
    const type = String(args.type || "activity");
    const title = String(args.title || "");
    if (!title) return { success: false, data: {}, message: "Event title is required." };
    const startTime = new Date(String(args.startTime || new Date().toISOString()));
    if (isNaN(startTime.getTime())) return { success: false, data: {}, message: "Invalid startTime. Use ISO format." };
    const event = await prisma.tripEvent.create({
      data: {
        tripId, type, title, startTime,
        endTime: args.endTime ? new Date(String(args.endTime)) : null,
        location: String(args.location || ""),
        address: String(args.address || ""),
        bookingRef: String(args.bookingRef || ""),
        confirmationNum: String(args.confirmationNum || ""),
        flightNumber: String(args.flightNumber || ""),
        airline: String(args.airline || ""),
        fromAirport: String(args.fromAirport || ""),
        toAirport: String(args.toAirport || ""),
        notes: String(args.notes || ""),
      },
    });
    const typeLabel = { flight: "Flight", hotel: "Hotel", activity: "Activity", transport: "Transport", car_rental: "Car rental" }[type] || type;
    return {
      success: true,
      data: { eventId: event.id, tripId },
      message: `${typeLabel} "${title}" added to trip on ${startTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
    };
  },

  ingest_travel_emails: async (_args, userId) => {
    const { parseEmailsForTrips } = await import("./trip-email-parser.js");
    const result = await parseEmailsForTrips(userId);
    return {
      success: true,
      data: result,
      message: result.tripsCreated === 0 && result.eventsCreated === 0
        ? "Email scan complete — no new travel bookings found. Make sure IMAP is configured in Settings."
        : `Email scan complete: ${result.tripsCreated} trip(s) created, ${result.eventsCreated} event(s) added${result.skipped > 0 ? `, ${result.skipped} skipped (already exist or not travel)` : ""}.`,
    };
  },

  check_flight_status: async (args, userId) => {
    let eventId = String(args.eventId || "");
    if (!eventId && args.flightNumber) {
      const flight = await prisma.tripEvent.findFirst({
        where: { trip: { userId }, flightNumber: String(args.flightNumber), startTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
      });
      if (flight) eventId = flight.id;
    }
    if (!eventId) return { success: false, data: {}, message: "Provide eventId or flightNumber to check status. Make sure the flight hasn't already departed." };
    const { checkFlightStatus } = await import("./flight-tracker.js");
    const result = await checkFlightStatus(eventId, userId);
    const emoji = { "on-time": "✅", "delayed": "⚠️", "cancelled": "❌", "landed": "🛬", "scheduled": "🛫" }[result.status] || "🛫";
    return {
      success: true,
      data: result,
      message: `${emoji} Status: ${result.status}` +
        (result.delayMinutes > 0 ? ` (+${result.delayMinutes} min delay)` : "") +
        (result.gate ? ` | Gate ${result.gate}` : "") +
        (result.terminal ? `, Terminal ${result.terminal}` : "") +
        (result.changed ? " ← status updated" : ""),
    };
  },

  add_poi: async (args, userId) => {
    const name = String(args.name || "");
    if (!name) return { success: false, data: {}, message: "Place name is required." };
    const poi = await prisma.pOI.create({
      data: {
        userId,
        name,
        address: String(args.address || ""),
        city: String(args.city || ""),
        country: String(args.country || ""),
        category: String(args.category || "other"),
        notes: String(args.notes || ""),
        visitedAt: args.visitedAt ? new Date(String(args.visitedAt)) : new Date(),
      },
    });
    const where = [poi.city, poi.country].filter(Boolean).join(", ");
    return {
      success: true,
      data: { poiId: poi.id },
      message: `"${name}"${where ? ` in ${where}` : ""} saved to your travel memory.`,
    };
  },

  update_poi: async (args, userId) => {
    const poiId = String(args.poiId || "");
    if (!poiId) return { success: false, data: {}, message: "poiId is required." };
    const poi = await prisma.pOI.findUnique({ where: { id: poiId } });
    if (!poi || poi.userId !== userId) return { success: false, data: {}, message: `POI ${poiId} not found.` };

    const data: any = {};
    if (args.name !== undefined) data.name = String(args.name);
    if (args.country !== undefined) data.country = String(args.country);
    if (args.city !== undefined) data.city = String(args.city);
    if (args.category !== undefined) data.category = String(args.category);
    if (args.address !== undefined) data.address = String(args.address);
    if (args.notes !== undefined) data.notes = String(args.notes);
    if (args.visitedAt !== undefined) data.visitedAt = new Date(String(args.visitedAt));

    await prisma.pOI.update({ where: { id: poiId }, data });
    return {
      success: true,
      data: { poiId },
      message: `"${poi.name}" updated — ${Object.keys(data).join(", ")} set.`,
    };
  },

  get_weather: async (_args, userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { city: true, timezone: true } });
    if (!user?.city) {
      return { success: false, data: {}, message: "No city set. Add your city in Settings → Profile so I can fetch weather." };
    }
    const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
    const FORECAST = "https://api.open-meteo.com/v1/forecast";
    try {
      const geoRes = await fetch(`${GEOCODE}?name=${encodeURIComponent(user.city)}&count=1&language=en`);
      const geo = await geoRes.json() as any;
      if (!geo.results?.length) return { success: false, data: {}, message: `City "${user.city}" not found. Update it in Settings → Profile.` };
      const { latitude, longitude, name, country } = geo.results[0];
      const tz = encodeURIComponent(user.timezone || "auto");
      const wxRes = await fetch(
        `${FORECAST}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${tz}&forecast_days=3`
      );
      const wx = await wxRes.json() as any;
      const CODES: Record<number, string> = {
        0: "Clear ☀️", 1: "Mostly clear 🌤", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
        45: "Foggy 🌫", 51: "Light drizzle 🌦", 53: "Drizzle 🌧", 61: "Light rain 🌧",
        63: "Rain 🌧", 65: "Heavy rain 🌧", 71: "Light snow 🌨", 73: "Snow ❄️",
        75: "Heavy snow ❄️", 80: "Showers 🌦", 95: "Thunderstorm ⛈",
      };
      const cond = CODES[wx.current?.weather_code] ?? "Unknown";
      const temp = Math.round(wx.current?.temperature_2m ?? 0);
      const wind = Math.round(wx.current?.wind_speed_10m ?? 0);
      const forecast = (wx.daily?.time ?? []).map((d: string, i: number) => ({
        date: d,
        high: Math.round(wx.daily.temperature_2m_max[i]),
        low: Math.round(wx.daily.temperature_2m_min[i]),
        condition: CODES[wx.daily.weather_code[i]] ?? "Unknown",
      }));
      const forecastLines = forecast.slice(0, 3).map((f: any) =>
        `  ${new Date(f.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${f.condition}, ${f.low}–${f.high}°C`
      ).join("\n");
      return {
        success: true,
        data: { city: name, country, temp, condition: cond, wind, forecast },
        message: `${name}, ${country}: ${cond}, ${temp}°C | Wind: ${wind} km/h\n\n3-day forecast:\n${forecastLines}`,
      };
    } catch (e: any) {
      return { success: false, data: {}, message: `Weather unavailable: ${e.message}` };
    }
  },

  create_shopping_rule: async (args, userId) => {
    const itemName = String(args.itemName || "");
    if (!itemName) return { success: false, data: {}, message: "itemName is required." };
    const trigger = String(args.trigger || "weekly");
    if (!["daily", "weekly", "monthly"].includes(trigger)) {
      return { success: false, data: {}, message: "trigger must be daily, weekly, or monthly." };
    }
    // Check for duplicate
    const existing = await prisma.shoppingRule.findFirst({ where: { userId, itemName, trigger } });
    if (existing) return { success: false, data: {}, message: `A ${trigger} rule for "${itemName}" already exists.` };

    const rule = await prisma.shoppingRule.create({
      data: {
        userId,
        itemName,
        quantity: String(args.quantity || "1"),
        category: String(args.category || ""),
        trigger,
        shopId: args.shopId ? String(args.shopId) : null,
      },
    });
    return {
      success: true,
      data: { ruleId: rule.id },
      message: `Auto-buy rule set: "${itemName}" (qty: ${rule.quantity}) will be added to your shopping list ${trigger}.`,
    };
  },

  get_poi_memory: async (args, userId) => {
    const where: any = { userId };
    if (args.country) where.country = { contains: String(args.country), mode: "insensitive" };
    if (args.city) where.city = { contains: String(args.city), mode: "insensitive" };
    if (args.category) where.category = String(args.category);
    if (args.missingCountry) where.country = { in: ["", null] };
    const pois = await prisma.pOI.findMany({ where, orderBy: { visitedAt: "desc" }, take: 50 });
    if (pois.length === 0) {
      const hint = args.country || args.city ? ` in ${args.city || ""}${args.city && args.country ? ", " : ""}${args.country || ""}` : "";
      return { success: true, data: { pois: [] }, message: `No places in memory${hint}.` };
    }
    const lines = pois.map((p) => `- poiId:${p.id} | "${p.name}" | city:${p.city || "?"} | country:${p.country || "MISSING"} | category:${p.category}`);
    return {
      success: true,
      data: { pois: pois.map((p) => ({ poiId: p.id, name: p.name, city: p.city, country: p.country, category: p.category })) },
      message: `Places (${pois.length}):\n${lines.join("\n")}`,
    };
  },

  list_tickets: async (args, userId) => {
    const status = args.status ? String(args.status) : undefined;
    const where: any = { userId };
    if (status) where.status = status;
    const tickets = await prisma.ticket.findMany({
      where, include: { agent: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20,
    });
    if (tickets.length === 0) return { success: true, data: { tickets: [] }, message: "No tickets found." };
    return {
      success: true,
      data: { tickets: tickets.map((t) => ({ id: t.id, title: t.title, status: t.status, agent: t.agent?.name })) },
      message: `Tickets:\n${tickets.map((t) => `  - [${t.status}] "${t.title}" (agent: ${t.agent?.name || "unassigned"})`).join("\n")}`,
    };
  },

  // ── Activate specialist agent ──────────────────────────────────────────────
  activate_specialist: async (args, userId) => {
    const slug = String(args.slug || "").trim();
    if (!slug) return { success: false, data: {}, message: "Specialist slug required (e.g. 'travel', 'finance', 'school', 'family', 'health')." };

    const mod = await prisma.module.findUnique({ where: { slug } });
    if (!mod) return { success: false, data: {}, message: `No specialist found with slug "${slug}". Available: travel, finance, school, family, health.` };
    if (mod.status === "installed") return { success: true, data: { slug }, message: `${mod.name} is already active.` };

    const manifest = JSON.parse(mod.manifest || "{}");
    for (const agentDef of manifest.agents || []) {
      const existing = await prisma.agent.findFirst({ where: { name: agentDef.name, moduleSlug: slug } });
      let agent = existing;
      if (!existing) {
        agent = await prisma.agent.create({
          data: {
            name: agentDef.name,
            description: agentDef.description || "",
            role: agentDef.role || "",
            mission: agentDef.mission || "",
            systemPrompt: agentDef.systemPrompt || "",
            model: agentDef.model || "gpt-4o-mini",
            temperature: agentDef.temperature ?? 0.7,
            maxTokens: agentDef.maxTokens ?? 2048,
            enabled: true,
            moduleSlug: slug,
            userId,
            tags: JSON.stringify(agentDef.tags || []),
          },
        });
      }
      if (agent && agentDef.skills) {
        for (const skillName of agentDef.skills) {
          const skill = await prisma.skill.findUnique({ where: { name: skillName } });
          if (skill) {
            await prisma.agentSkill.upsert({
              where: { agentId_skillId: { agentId: agent.id, skillId: skill.id } },
              update: {},
              create: { agentId: agent.id, skillId: skill.id },
            });
          }
        }
      }
    }
    await prisma.module.update({ where: { slug }, data: { status: "installed", installedAt: new Date() } });
    await log("info", "skill:activate_specialist", `Specialist "${slug}" activated by user ${userId}`);
    return { success: true, data: { slug }, message: `${mod.name || slug} specialist is now active and ready.` };
  },

  // ── Synchronous specialist delegation — Marcel gets the result back immediately ──
  delegate_to_agent: async (args, userId) => {
    const agentId   = String(args.agentId   || "").trim();
    const agentName = String(args.agentName || "").trim();
    const task      = String(args.task      || "").trim();
    const context   = String(args.context   || "").trim();

    if (!task) return { success: false, data: {}, message: "A task description is required." };

    // Resolve agent by id or name
    const agent = agentId
      ? await prisma.agent.findFirst({ where: { id: agentId, enabled: true } })
      : await prisma.agent.findFirst({ where: { name: { contains: agentName }, enabled: true, OR: [{ userId }, { userId: null }] } });

    if (!agent) {
      return {
        success: false,
        data: {},
        message: agentId
          ? `No agent found with id "${agentId}". Call list_agents to see available agents.`
          : `No agent found named "${agentName}". Call list_agents to see available agents.`,
      };
    }

    const prompt = context
      ? `${task}\n\nContext:\n${context}`
      : task;

    const { chatWithAgent } = await import("./chat.js");
    const conversation = await prisma.conversation.create({
      data: { agentId: agent.id, title: `Delegation: ${task.slice(0, 80)}` },
    });

    const result = await chatWithAgent(agent.id, conversation.id, prompt, userId);
    const output = result.message.content;

    // Store in agent memory for continuity
    const { storeMemory } = await import("./memory.js");
    await storeMemory(agent.id, `Completed delegation: "${task.slice(0, 100)}" — ${output.slice(0, 1000)}`, "delegation_result", {});

    await log("info", "skill:delegate_to_agent", `Agent "${agent.name}" completed delegation: "${task.slice(0, 60)}"`, { agentId: agent.id });
    return {
      success: true,
      data: { agentId: agent.id, agentName: agent.name, output },
      message: `**${agent.name} says:**\n\n${output}`,
    };
  },

  // ── Household / Family skills ──────────────────────────────────────────────
  get_household_context: async (_args, userId) => {
    const { getUserHouseholdId, getHouseholdMembers, provisionHousehold } = await import("./household.js");
    let householdId = await getUserHouseholdId(userId);
    if (!householdId) householdId = await provisionHousehold(userId);

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [members, events, tasks, shopping] = await Promise.all([
      getHouseholdMembers(householdId),
      prisma.calendarEvent.findMany({
        where: { householdId, startAt: { gte: now, lte: in7days } },
        orderBy: { startAt: "asc" },
        take: 20,
        include: { user: { select: { name: true } } },
      }),
      prisma.ticket.findMany({
        where: { householdId, status: { notIn: ["done", "failed"] } },
        orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
        take: 20,
        include: { user: { select: { name: true } } },
      }),
      prisma.shoppingItem.findMany({
        where: { householdId, status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const lines: string[] = [];
    lines.push(`## Family Members\n${members.map((m) => `- ${m.user.name} (${m.role})`).join("\n")}`);
    if (events.length > 0) {
      lines.push(`## Shared Calendar (next 7 days)\n${events.map((e) => `- ${new Date(e.startAt).toLocaleDateString()} ${e.title}${e.user ? ` (${e.user.name})` : ""}`).join("\n")}`);
    }
    if (tasks.length > 0) {
      lines.push(`## Household Tasks\n${tasks.map((t) => `- [${t.status}] ${t.title}${t.user ? ` — ${t.user.name}` : ""}`).join("\n")}`);
    }
    if (shopping.length > 0) {
      lines.push(`## Shared Shopping List\n${shopping.map((s) => `- ${s.name}${s.quantity !== "1" ? ` (${s.quantity})` : ""}${s.user ? ` — added by ${s.user.name}` : ""}`).join("\n")}`);
    }

    return { success: true, data: { memberCount: members.length, eventCount: events.length, taskCount: tasks.length, shoppingCount: shopping.length }, message: lines.join("\n\n") };
  },

  delegate_to_member: async (args, userId) => {
    const memberName  = String(args.memberName  || "").trim();
    const title       = String(args.title       || "").trim();
    const description = String(args.description || "").trim();
    const priority    = String(args.priority    || "medium");
    const dueAt       = args.dueAt ? new Date(String(args.dueAt)) : null;

    if (!memberName || !title) return { success: false, data: {}, message: "memberName and title are required." };

    const { getUserHouseholdId, provisionHousehold } = await import("./household.js");
    let householdId = await getUserHouseholdId(userId);
    if (!householdId) householdId = await provisionHousehold(userId);

    const member = await prisma.user.findFirst({
      where: { name: { contains: memberName, mode: "insensitive" }, householdMemberships: { some: { householdId } } },
    });
    if (!member) return { success: false, data: {}, message: `No family member named "${memberName}" found.` };
    if (member.id === userId) return { success: false, data: {}, message: "You can't delegate to yourself. Use create_ticket instead." };

    const orchId = `orch-${member.id}`;
    const orch = await prisma.agent.findUnique({ where: { id: orchId } });
    if (!orch) return { success: false, data: {}, message: `${member.name} doesn't have an assistant set up yet.` };

    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || `Assigned by ${caller?.name || "a family member"}`,
        priority,
        status: "queued",
        category: "Personal",
        agentId: orchId,
        userId: member.id,
        householdId,
        delegatedFromUserId: userId,
        ...(dueAt ? { dueAt } : {}),
      },
    });

    const { createNotification } = await import("../routes/notifications.js");
    await createNotification(member.id, "delegation", `New task from ${caller?.name || "family"}`, title, "/tools/todo");

    await log("info", "skill:delegate_to_member", `Task delegated to ${member.name}: "${title}"`, { ticketId: ticket.id });
    return { success: true, data: { ticketId: ticket.id, memberName: member.name }, message: `Task delegated to ${member.name}'s assistant: "${title}"` };
  },

  add_household_event: async (args, userId) => {
    const title    = String(args.title   || "").trim();
    const startAt  = args.startAt ? new Date(String(args.startAt)) : null;
    if (!title || !startAt) return { success: false, data: {}, message: "title and startAt are required." };

    const { getUserHouseholdId, getHouseholdMembers, provisionHousehold } = await import("./household.js");
    let householdId = await getUserHouseholdId(userId);
    if (!householdId) householdId = await provisionHousehold(userId);

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        startAt,
        endAt:    args.endAt    ? new Date(String(args.endAt))   : null,
        allDay:   Boolean(args.allDay),
        location: String(args.location || ""),
        userId,
        householdId,
      },
    });

    // Notify other members
    const members = await getHouseholdMembers(householdId);
    const { createNotification } = await import("../routes/notifications.js");
    const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    for (const m of members) {
      if (m.userId !== userId) {
        await createNotification(m.userId, "family_event", `New family event: ${title}`, `Added by ${creator?.name}`, "/tools/calendar");
      }
    }

    return { success: true, data: { eventId: event.id }, message: `Family event "${title}" created for ${startAt.toLocaleDateString()}.` };
  },

  add_household_task: async (args, userId) => {
    const title       = String(args.title       || "").trim();
    const description = String(args.description || "").trim();
    const priority    = String(args.priority    || "medium");
    const assignTo    = String(args.assignTo    || "").trim();
    const dueAt       = args.dueAt ? new Date(String(args.dueAt)) : null;

    if (!title) return { success: false, data: {}, message: "title is required." };

    const { getUserHouseholdId, getHouseholdMembers, provisionHousehold } = await import("./household.js");
    let householdId = await getUserHouseholdId(userId);
    if (!householdId) householdId = await provisionHousehold(userId);

    let assignedAgentId: string | null = null;
    let assignedUserId: string | null = null;
    if (assignTo) {
      const member = await prisma.user.findFirst({
        where: { name: { contains: assignTo, mode: "insensitive" }, householdMemberships: { some: { householdId } } },
      });
      if (member) { assignedUserId = member.id; assignedAgentId = `orch-${member.id}`; }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title, description, priority, status: "queued", category: "Personal",
        householdId, userId: assignedUserId || userId,
        agentId: assignedAgentId,
        ...(dueAt ? { dueAt } : {}),
      },
    });

    // Notify all household members
    const members = await getHouseholdMembers(householdId);
    const { createNotification } = await import("../routes/notifications.js");
    for (const m of members) {
      if (m.userId !== userId) {
        await createNotification(m.userId, "household_task", `New household task: ${title}`, description.slice(0, 100), "/tools/todo");
      }
    }

    return { success: true, data: { ticketId: ticket.id }, message: `Household task "${title}" created${assignTo ? ` and assigned to ${assignTo}` : ""}.` };
  },

  add_to_household_shopping_list: async (args, userId) => {
    const name     = String(args.name     || "").trim();
    const quantity = String(args.quantity || "1");
    const category = String(args.category || "");
    const notes    = String(args.notes    || "");
    const priority = String(args.priority || "normal");

    if (!name) return { success: false, data: {}, message: "name is required." };

    const { getUserHouseholdId, provisionHousehold } = await import("./household.js");
    let householdId = await getUserHouseholdId(userId);
    if (!householdId) householdId = await provisionHousehold(userId);

    const item = await prisma.shoppingItem.create({
      data: { name, quantity, category, notes, priority, userId, householdId, addedBy: "agent" },
    });

    return { success: true, data: { itemId: item.id }, message: `"${name}" added to the household shopping list.` };
  },

  get_household_shopping_list: async (_args, userId) => {
    const { getUserHouseholdId, provisionHousehold } = await import("./household.js");
    let householdId = await getUserHouseholdId(userId);
    if (!householdId) householdId = await provisionHousehold(userId);

    const items = await prisma.shoppingItem.findMany({
      where: { householdId, status: "pending" },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: { user: { select: { name: true } } },
    });

    if (items.length === 0) return { success: true, data: { items: [] }, message: "Household shopping list is empty." };

    const lines = items.map((i) => `- ${i.name}${i.quantity !== "1" ? ` (${i.quantity})` : ""}${i.category ? ` [${i.category}]` : ""}${i.user ? ` — ${i.user.name}` : ""}`);
    return { success: true, data: { items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })) }, message: `Household shopping list (${items.length} items):\n${lines.join("\n")}` };
  },

  // ── Multi-step plan-and-execute ────────────────────────────────────────────
  plan_and_execute: async (args, userId) => {
    const goal    = String(args.goal    || "").trim();
    const context = String(args.context || "").trim();
    if (!goal) return { success: false, data: {}, message: "A goal is required." };

    const { planAndExecute } = await import("./plan-executor.js");
    const result = await planAndExecute(goal, context, userId);

    return {
      success: result.success,
      data: {
        ticketId: result.ticketId,
        stepCount: result.stepLogs.length,
        stepsCompleted: result.stepLogs.filter((s) => s.status === "done").length,
      },
      message: result.summary,
    };
  },
};

export async function executeSkill(skillName: string, argsJson: string, userId: string): Promise<SkillResult> {
  // Rate limit: 60 skill calls per user per minute
  if (!checkSkillRateLimit(userId)) {
    return {
      success: false,
      data: { code: "GUARDRAIL", canLogTicket: true },
      message: "Rate limit exceeded. You have used too many skills in the last minute. Please wait and try again.",
    };
  }

  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson || "{}");
  } catch {
    return { success: false, data: {}, message: `Invalid JSON arguments for skill ${skillName}.` };
  }

  const handler = BUILTIN_SKILLS[skillName];
  if (handler) {
    try {
      return await handler(args, userId);
    } catch (e: any) {
      await log("error", `skill:${skillName}`, `Execution error: ${e.message}`, { args });
      return { success: false, data: {}, message: `Skill "${skillName}" threw an error: ${e.message}` };
    }
  }

  return { success: false, data: {}, message: `Skill "${skillName}" has no built-in implementation. Generate a stub from Skill Gaps.` };
}
