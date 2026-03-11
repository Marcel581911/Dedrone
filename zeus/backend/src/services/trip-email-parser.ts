import { ImapFlow } from "imapflow";
import OpenAI from "openai";
import { prisma } from "../db.js";
import { log } from "../logger.js";

const TRAVEL_KEYWORDS = [
  "booking",
  "confirmation",
  "reservation",
  "itinerary",
  "e-ticket",
  "flight",
  "hotel",
  "check-in",
  "your trip",
  "travel",
];

const PARSE_PROMPT = `You are a travel booking parser. Extract trip information from this email.
Return ONLY valid JSON:
{
  "isTravel": boolean,
  "type": "flight"|"hotel"|"activity"|"transport"|"car_rental"|null,
  "title": "string",
  "startTime": "ISO datetime or null",
  "endTime": "ISO datetime or null",
  "location": "string",
  "address": "string",
  "bookingRef": "string",
  "confirmationNum": "string",
  "notes": "string",
  "flightNumber": "string (IATA format like UA123)",
  "airline": "string",
  "fromAirport": "IATA code or empty",
  "toAirport": "IATA code or empty",
  "destination": "city name"
}
If this is not a travel booking email, set isTravel: false and all other fields to empty/null.`;

interface ParsedEmail {
  isTravel: boolean;
  type: string | null;
  title: string;
  startTime: string | null;
  endTime: string | null;
  location: string;
  address: string;
  bookingRef: string;
  confirmationNum: string;
  notes: string;
  flightNumber: string;
  airline: string;
  fromAirport: string;
  toAirport: string;
  destination: string;
}

interface EmailGroup {
  destination: string;
  events: ParsedEmail[];
  startDate: Date;
  endDate: Date;
}

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function tripsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA <= endB && endA >= startB;
}

function groupIntoTrips(parsed: ParsedEmail[], homeAirport: string): EmailGroup[] {
  const travelEvents = parsed.filter((p) => p.isTravel && p.startTime);

  // Sort by startTime
  travelEvents.sort((a, b) => {
    const da = parseDate(a.startTime)?.getTime() || 0;
    const db = parseDate(b.startTime)?.getTime() || 0;
    return da - db;
  });

  const groups: EmailGroup[] = [];

  for (const event of travelEvents) {
    const eventStart = parseDate(event.startTime);
    if (!eventStart) continue;

    const eventEnd = parseDate(event.endTime) || eventStart;
    const dest = event.destination || event.location || "Unknown";

    // Try to find an existing group within 30 days and matching destination
    let placed = false;
    for (const group of groups) {
      const withinRange =
        Math.abs(eventStart.getTime() - group.startDate.getTime()) <= 30 * 24 * 60 * 60 * 1000 ||
        Math.abs(eventStart.getTime() - group.endDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;

      const destMatch =
        dest.toLowerCase() === group.destination.toLowerCase() ||
        group.destination === "Unknown" ||
        dest === "Unknown";

      if (withinRange && destMatch) {
        group.events.push(event);
        if (eventStart < group.startDate) group.startDate = eventStart;
        if (eventEnd > group.endDate) group.endDate = eventEnd;
        if (dest !== "Unknown") group.destination = dest;
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push({
        destination: dest,
        events: [event],
        startDate: eventStart,
        endDate: eventEnd,
      });
    }
  }

  return groups;
}

export async function parseEmailsForTrips(userId: string): Promise<{
  tripsCreated: number;
  eventsCreated: number;
  skipped: number;
}> {
  // Fetch all required settings in parallel
  const settingKeys = [
    "email_imap_host",
    "email_imap_port",
    "email_imap_user",
    "email_imap_pass",
    "openai_api_key",
  ];

  const settings = await prisma.setting.findMany({
    where: { key: { in: settingKeys } },
  });
  const cfg: Record<string, string> = {};
  for (const s of settings) cfg[s.key] = s.value;

  const imapHost = cfg["email_imap_host"];
  const imapUser = cfg["email_imap_user"];
  const imapPass = cfg["email_imap_pass"];
  const imapPort = cfg["email_imap_port"] || "993";
  const apiKey = cfg["openai_api_key"];

  if (!imapHost || !imapUser || !imapPass) {
    await log("warn", "trip-email-parser", "IMAP not configured — skipping email import");
    return { tripsCreated: 0, eventsCreated: 0, skipped: 0 };
  }

  if (!apiKey) {
    await log("warn", "trip-email-parser", "OpenAI API key not configured — skipping email import");
    return { tripsCreated: 0, eventsCreated: 0, skipped: 0 };
  }

  // Fetch user's homeAirport preference (stored on their trips or default)
  const openai = new OpenAI({ apiKey });

  const client = new ImapFlow({
    host: imapHost,
    port: parseInt(imapPort),
    secure: true,
    auth: { user: imapUser, pass: imapPass },
    logger: false,
  });

  const collectedEmails: { subject: string; text: string }[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const since = new Date();
      since.setDate(since.getDate() - 90);

      for await (const msg of client.fetch({ since }, { envelope: true, source: true })) {
        if (collectedEmails.length >= 50) break;

        const subject: string = msg.envelope?.subject || "";
        const subjectLower = subject.toLowerCase();

        const isTravel = TRAVEL_KEYWORDS.some((kw) => subjectLower.includes(kw));
        if (!isTravel) continue;

        let text = "";
        if (msg.source) {
          const raw = msg.source.toString();
          // Extract plain text part
          const textMatch = raw.match(
            /Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i
          );
          text = textMatch ? textMatch[1].trim() : raw.slice(0, 3000);
        }

        collectedEmails.push({ subject, text });
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (e: any) {
    await log("error", "trip-email-parser", `IMAP fetch failed: ${e.message}`);
    return { tripsCreated: 0, eventsCreated: 0, skipped: 0 };
  }

  await log(
    "info",
    "trip-email-parser",
    `Found ${collectedEmails.length} travel-keyword email(s) to parse`
  );

  const parsedResults: ParsedEmail[] = [];
  let skipped = 0;

  for (const email of collectedEmails) {
    try {
      const emailText = `Subject: ${email.subject}\n\n${email.text}`;
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PARSE_PROMPT },
          { role: "user", content: emailText.slice(0, 3000) },
        ],
        response_format: { type: "json_object" },
      });

      const parsed: ParsedEmail = JSON.parse(res.choices[0].message.content || "{}");
      if (parsed.isTravel) {
        parsedResults.push(parsed);
      } else {
        skipped++;
      }
    } catch (e: any) {
      await log("warn", "trip-email-parser", `Failed to parse email "${email.subject}": ${e.message}`);
      skipped++;
    }
  }

  // Group events into trips (home airport defaults to "SFO")
  const groups = groupIntoTrips(parsedResults, "SFO");

  let tripsCreated = 0;
  let eventsCreated = 0;

  for (const group of groups) {
    try {
      // Check if a trip already exists for this user with overlapping dates
      const existingTrips = await prisma.trip.findMany({
        where: { userId },
        select: { id: true, startDate: true, endDate: true },
      });

      const overlaps = existingTrips.some((t) => {
        const ts = new Date(t.startDate);
        const te = new Date(t.endDate);
        return tripsOverlap(group.startDate, group.endDate, ts, te);
      });

      if (overlaps) {
        skipped += group.events.length;
        continue;
      }

      const destination = group.destination || "Unknown Destination";
      const trip = await prisma.trip.create({
        data: {
          userId,
          name: `Trip to ${destination}`,
          destination,
          homeAirport: "SFO",
          startDate: group.startDate,
          endDate: group.endDate,
          status: "upcoming",
        },
      });

      tripsCreated++;

      for (const event of group.events) {
        try {
          const startTime = parseDate(event.startTime);
          const endTime = parseDate(event.endTime);

          if (!startTime) continue;

          await prisma.tripEvent.create({
            data: {
              tripId: trip.id,
              type: (event.type as any) || "activity",
              title: event.title || "Booking",
              startTime,
              endTime: endTime || undefined,
              location: event.location || destination,
              address: event.address || "",
              bookingRef: event.bookingRef || "",
              confirmationNum: event.confirmationNum || "",
              notes: event.notes || "",
              flightNumber: event.flightNumber || "",
              airline: event.airline || "",
              fromAirport: event.fromAirport || "",
              toAirport: event.toAirport || "",
              flightStatus: "scheduled",
              delayMinutes: 0,
            },
          });

          eventsCreated++;

          // For hotel and activity events, also create a POI
          if (event.type === "hotel" || event.type === "activity") {
            const poiName = event.location || event.title || "Place";
            await prisma.pOI.create({
              data: {
                userId,
                tripId: trip.id,
                name: poiName,
                address: event.address || "",
                city: destination,
                country: "",
                category: event.type,
                notes: event.notes || "",
              },
            });
          }
        } catch (e: any) {
          await log("warn", "trip-email-parser", `Failed to create event in trip ${trip.id}: ${e.message}`);
        }
      }
    } catch (e: any) {
      await log("error", "trip-email-parser", `Failed to create trip for group "${group.destination}": ${e.message}`);
    }
  }

  await log(
    "info",
    "trip-email-parser",
    `Import done: ${tripsCreated} trips, ${eventsCreated} events, ${skipped} skipped`
  );

  return { tripsCreated, eventsCreated, skipped };
}
