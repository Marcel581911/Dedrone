import { prisma } from "../db.js";
import { log } from "../logger.js";
import { sendAlert } from "./alerts.js";

async function getFlightApiConfig(): Promise<{ apiKey: string; baseUrl: string }> {
  const [keySetting, urlSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "flight_api_key" } }),
    prisma.setting.findUnique({ where: { key: "flight_api_url" } }),
  ]);
  return {
    apiKey: keySetting?.value || "",
    baseUrl: urlSetting?.value || "https://aeroapi.flightaware.com/aeroapi",
  };
}

function mapAeroApiStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("scheduled")) return "scheduled";
  if (s.includes("en route") || s.includes("active") || s.includes("on time")) return "on-time";
  if (s.includes("landed") || s.includes("arrived")) return "landed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("delay")) return "delayed";
  return "scheduled";
}

export async function checkFlightStatus(
  eventId: string,
  userId: string
): Promise<{ status: string; delayMinutes: number; gate?: string; terminal?: string; changed: boolean }> {
  const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    await log("warn", "flight-tracker", `TripEvent not found: ${eventId}`);
    return { status: "scheduled", delayMinutes: 0, changed: false };
  }

  const { apiKey, baseUrl } = await getFlightApiConfig();

  if (!apiKey) {
    return {
      status: event.flightStatus || "scheduled",
      delayMinutes: event.delayMinutes || 0,
      changed: false,
    };
  }

  if (!event.flightNumber) {
    return {
      status: event.flightStatus || "scheduled",
      delayMinutes: event.delayMinutes || 0,
      changed: false,
    };
  }

  try {
    const url = `${baseUrl}/flights/${encodeURIComponent(event.flightNumber)}/last`;
    const res = await fetch(url, {
      headers: { "x-apikey": apiKey },
    });

    if (!res.ok) {
      await log("warn", "flight-tracker", `AeroAPI returned ${res.status} for flight ${event.flightNumber}`);
      return {
        status: event.flightStatus || "scheduled",
        delayMinutes: event.delayMinutes || 0,
        changed: false,
      };
    }

    const data: any = await res.json();
    const flight = data.flights?.[0] || data;

    const rawStatus: string = flight.status || flight.flight_status || "";
    const newStatus = mapAeroApiStatus(rawStatus);
    const newDelayMinutes: number =
      flight.departure_delay != null
        ? Math.round(flight.departure_delay / 60)
        : flight.delay_minutes || 0;

    const newGate: string | undefined =
      flight.gate_destination || flight.gate_origin || flight.last_position?.gate || undefined;
    const newTerminal: string | undefined =
      flight.terminal_destination || flight.terminal_origin || undefined;

    const prevStatus = event.flightStatus || "scheduled";
    const changed = prevStatus !== newStatus || (event.delayMinutes || 0) !== newDelayMinutes;

    if (changed) {
      await prisma.tripEvent.update({
        where: { id: eventId },
        data: {
          flightStatus: newStatus,
          delayMinutes: newDelayMinutes,
          gate: newGate ?? event.gate,
          terminal: newTerminal ?? event.terminal,
        },
      });

      await prisma.flightTracking.updateMany({
        where: { eventId },
        data: { lastChecked: new Date(), lastStatus: newStatus },
      });

      let alertMessage = `Flight ${event.flightNumber} update: `;
      if (newStatus === "delayed") {
        alertMessage += `Delayed by ${newDelayMinutes} minutes`;
        if (newGate) alertMessage += ` — Gate ${newGate}`;
      } else if (newStatus === "cancelled") {
        alertMessage += `Cancelled`;
      } else if (newStatus === "landed") {
        alertMessage += `Landed`;
        if (newGate) alertMessage += ` at Gate ${newGate}`;
      } else {
        alertMessage += `Status changed to ${newStatus}`;
      }

      await sendAlert(userId, alertMessage).catch(() => {});
    } else {
      await prisma.flightTracking.updateMany({
        where: { eventId },
        data: { lastChecked: new Date(), lastStatus: newStatus },
      });
    }

    return {
      status: newStatus,
      delayMinutes: newDelayMinutes,
      gate: newGate,
      terminal: newTerminal,
      changed,
    };
  } catch (e: any) {
    await log("error", "flight-tracker", `checkFlightStatus error for event ${eventId}: ${e.message}`);
    return {
      status: event.flightStatus || "scheduled",
      delayMinutes: event.delayMinutes || 0,
      changed: false,
    };
  }
}

export async function checkAllActiveFlights(): Promise<void> {
  const trackings = await prisma.flightTracking.findMany({
    where: { active: true },
    include: { event: true },
  });

  const now = new Date();
  let checked = 0;
  let skipped = 0;

  for (const tracking of trackings) {
    const event = tracking.event;
    if (!event) {
      skipped++;
      continue;
    }

    if (event.startTime && new Date(event.startTime) <= now) {
      skipped++;
      continue;
    }

    try {
      await checkFlightStatus(tracking.eventId, tracking.userId);
      checked++;
    } catch (e: any) {
      await log("warn", "flight-tracker", `Failed to check flight for event ${tracking.eventId}: ${e.message}`);
    }
  }

  await log(
    "info",
    "flight-tracker",
    `Checked ${checked} active flight(s), skipped ${skipped} past/missing`
  );
}

export async function subscribeToFlight(
  eventId: string,
  userId: string
): Promise<{ subscriptionId: string }> {
  const { apiKey, baseUrl } = await getFlightApiConfig();

  if (!apiKey) {
    return { subscriptionId: "" };
  }

  const event = await prisma.tripEvent.findUnique({ where: { id: eventId } });
  if (!event || !event.flightNumber) {
    return { subscriptionId: "" };
  }

  try {
    const startDateStr = event.startTime
      ? new Date(event.startTime).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/alerts`, {
      method: "POST",
      headers: {
        "x-apikey": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ident: event.flightNumber,
        origin: event.fromAirport || undefined,
        destination: event.toAirport || undefined,
        date: startDateStr,
        channels: "all",
        alert_id: eventId,
      }),
    });

    if (!res.ok) {
      await log("warn", "flight-tracker", `AeroAPI subscribe returned ${res.status} for flight ${event.flightNumber}`);
      return { subscriptionId: "" };
    }

    const data: any = await res.json();
    const subscriptionId: string = String(data.alert_id || data.id || "");

    if (subscriptionId) {
      await prisma.flightTracking.updateMany({
        where: { eventId },
        data: { subscriptionId },
      });
    }

    return { subscriptionId };
  } catch (e: any) {
    await log("error", "flight-tracker", `subscribeToFlight error for event ${eventId}: ${e.message}`);
    return { subscriptionId: "" };
  }
}
