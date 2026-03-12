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
    baseUrl: urlSetting?.value || "https://airlabs.co/api/v9",
  };
}

function mapAirLabsStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (s === "scheduled") return "scheduled";
  if (s === "active" || s === "en-route") return "on-time";
  if (s === "landed") return "landed";
  if (s === "cancelled") return "cancelled";
  if (s === "diverted" || s === "redirected") return "diverted";
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
    const url = `${baseUrl}/flight?flight_iata=${encodeURIComponent(event.flightNumber)}&api_key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      await log("warn", "flight-tracker", `AirLabs returned ${res.status} for flight ${event.flightNumber}`);
      return {
        status: event.flightStatus || "scheduled",
        delayMinutes: event.delayMinutes || 0,
        changed: false,
      };
    }

    const data: any = await res.json();
    const flight = data.response;

    if (!flight) {
      return { status: event.flightStatus || "scheduled", delayMinutes: event.delayMinutes || 0, changed: false };
    }

    const rawStatus: string = flight.status || "";
    const newStatus = mapAirLabsStatus(rawStatus);
    const newDelayMinutes: number = flight.delayed || 0;

    const newGate: string | undefined = flight.arr_gate || flight.dep_gate || undefined;
    const newTerminal: string | undefined = flight.arr_terminal || flight.dep_terminal || undefined;

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

// AirLabs uses polling (no push subscriptions) — just mark the flight as actively tracked
export async function subscribeToFlight(
  eventId: string,
  _userId: string
): Promise<{ subscriptionId: string }> {
  await prisma.flightTracking.updateMany({
    where: { eventId },
    data: { subscriptionId: eventId, lastChecked: new Date() },
  });
  return { subscriptionId: eventId };
}
