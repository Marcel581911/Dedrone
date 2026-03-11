/**
 * Smart Import — parses any uploaded file and populates relevant life OS modules.
 * Creates tasks, shopping items, calendar events, reminders, notes, and POIs
 * based on what's detected in the content. Returns a manifest of everything
 * created so the user can review and delete individual items.
 */
import { prisma } from "../db.js";
import OpenAI from "openai";
import { log } from "../logger.js";

export type ArtifactType = "ticket" | "shopping_item" | "calendar_event" | "reminder" | "note" | "poi";

export interface ImportArtifact {
  type: ArtifactType;
  id: string;
  title: string;
}

export interface SmartImportResult {
  artifacts: ImportArtifact[];
  summary: string;
  counts: Record<string, number>;
}

const TYPE_LABEL: Record<ArtifactType, string> = {
  ticket: "task",
  shopping_item: "shopping item",
  calendar_event: "calendar event",
  reminder: "reminder",
  note: "note",
  poi: "place",
};

export async function smartImport(
  textContent: string,
  filename: string,
  userId: string
): Promise<SmartImportResult> {
  const empty: SmartImportResult = { artifacts: [], summary: "", counts: {} };

  const apiKeySetting = await prisma.setting.findUnique({ where: { key: "openai_api_key" } });
  if (!apiKeySetting?.value) {
    return { ...empty, summary: "Stored in memory (OpenAI not configured — structured extraction unavailable)." };
  }

  const client = new OpenAI({ apiKey: apiKeySetting.value });

  let extracted: any = {};
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a life OS data extractor. Given a document, extract structured data and return ONLY valid JSON with these optional arrays. Only include arrays that have actual data from the document.

{
  "tasks": [{ "title": string, "description": string?, "priority": "low"|"medium"|"high", "dueAt": ISO8601? }],
  "shoppingItems": [{ "name": string, "quantity": string?, "category": string? }],
  "events": [{ "title": string, "startAt": ISO8601, "endAt": ISO8601?, "location": string?, "allDay": boolean? }],
  "reminders": [{ "title": string, "dueAt": ISO8601, "recurring": "daily"|"weekly"|"monthly"? }],
  "notes": [{ "title": string?, "content": string }],
  "pois": [{ "name": string, "city": string?, "country": string?, "category": "restaurant"|"cafe"|"museum"|"hotel"|"attraction"|"park"|"shopping"|"transport"|"other"?, "notes": string? }]
}

Rules:
- tasks: action items, to-dos, things to do, assignments
- shoppingItems: grocery lists, shopping lists, items to buy
- events: meetings, appointments, bookings with specific dates/times
- reminders: deadlines, due dates, follow-ups (must have a date)
- notes: reference info, instructions, general content worth remembering
- pois: places visited, restaurants mentioned, destinations, addresses
- Keep titles short (under 80 chars). Dates relative to now: ${new Date().toISOString()}`,
        },
        {
          role: "user",
          content: `File: ${filename}\n\n${textContent.slice(0, 8000)}`,
        },
      ],
    });

    extracted = JSON.parse(completion.choices[0].message.content || "{}");
  } catch (e: any) {
    await log("warn", "smart-import", `Extraction failed for ${filename}: ${e.message}`);
    return { ...empty, summary: `Stored in memory — could not parse structure of "${filename}".` };
  }

  const artifacts: ImportArtifact[] = [];

  // Tasks / To-Do
  for (const t of extracted.tasks || []) {
    if (!t.title) continue;
    try {
      const ticket = await prisma.ticket.create({
        data: {
          title: String(t.title).slice(0, 200),
          description: String(t.description || ""),
          priority: ["low", "medium", "high", "critical"].includes(t.priority) ? t.priority : "medium",
          category: "Personal",
          status: "queued",
          dueAt: t.dueAt ? new Date(t.dueAt) : null,
          userId,
          output: "",
        },
      });
      artifacts.push({ type: "ticket", id: ticket.id, title: ticket.title });
    } catch {}
  }

  // Shopping items
  for (const s of extracted.shoppingItems || []) {
    if (!s.name) continue;
    try {
      const item = await prisma.shoppingItem.create({
        data: {
          userId,
          name: String(s.name).slice(0, 200),
          quantity: String(s.quantity || "1"),
          category: String(s.category || ""),
          status: "pending",
          addedBy: "import",
        },
      });
      artifacts.push({ type: "shopping_item", id: item.id, title: item.name });
    } catch {}
  }

  // Calendar events
  for (const e of extracted.events || []) {
    if (!e.title || !e.startAt) continue;
    try {
      const startDate = new Date(e.startAt);
      if (isNaN(startDate.getTime())) continue;
      const event = await prisma.calendarEvent.create({
        data: {
          title: String(e.title).slice(0, 200),
          startAt: startDate,
          endAt: e.endAt ? new Date(e.endAt) : null,
          location: String(e.location || ""),
          allDay: Boolean(e.allDay),
          source: "import",
          userId,
        },
      });
      artifacts.push({ type: "calendar_event", id: event.id, title: event.title });
    } catch {}
  }

  // Reminders
  for (const r of extracted.reminders || []) {
    if (!r.title || !r.dueAt) continue;
    try {
      const dueDate = new Date(r.dueAt);
      if (isNaN(dueDate.getTime())) continue;
      const reminder = await prisma.reminder.create({
        data: {
          title: String(r.title).slice(0, 200),
          dueAt: dueDate,
          recurring: ["daily", "weekly", "monthly"].includes(r.recurring) ? r.recurring : "",
          userId,
          status: "pending",
          notified: false,
        },
      });
      artifacts.push({ type: "reminder", id: reminder.id, title: reminder.title });
    } catch {}
  }

  // Notes
  for (const n of extracted.notes || []) {
    if (!n.content) continue;
    try {
      const note = await prisma.note.create({
        data: {
          title: String(n.title || filename).slice(0, 200),
          content: String(n.content),
          pinned: false,
          userId,
        },
      });
      artifacts.push({ type: "note", id: note.id, title: note.title || "Note" });
    } catch {}
  }

  // POIs / Places
  for (const p of extracted.pois || []) {
    if (!p.name) continue;
    try {
      const poi = await prisma.pOI.create({
        data: {
          userId,
          name: String(p.name).slice(0, 200),
          city: String(p.city || ""),
          country: String(p.country || ""),
          category: ["restaurant", "cafe", "museum", "hotel", "attraction", "park", "shopping", "transport", "other"].includes(p.category) ? p.category : "other",
          notes: String(p.notes || ""),
        },
      });
      artifacts.push({ type: "poi", id: poi.id, title: `${poi.name}${poi.city ? ` · ${poi.city}` : ""}` });
    } catch {}
  }

  // Build human-readable summary
  const counts: Record<string, number> = {};
  for (const a of artifacts) counts[a.type] = (counts[a.type] || 0) + 1;

  const parts = (Object.entries(counts) as [ArtifactType, number][])
    .map(([type, n]) => `${n} ${TYPE_LABEL[type]}${n > 1 ? "s" : ""}`);

  const summary = parts.length > 0
    ? `Created from "${filename}": ${parts.join(", ")}`
    : `No structured data found in "${filename}" — content stored in memory.`;

  if (artifacts.length > 0) {
    await log("info", "smart-import", summary, { userId, count: artifacts.length });
  }

  return { artifacts, summary, counts };
}
