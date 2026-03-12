import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Input, Label, Badge, EmptyState } from "../components/ui";

interface Props { profile?: any; }

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtRange(start: string, end: string) {
  if (!start) return "";
  if (!end) return fmtDate(start);
  const s = new Date(start);
  const e = new Date(end);
  const sStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const eStr = e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${sStr} – ${eStr}`;
}

function nightCount(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const TYPE_ICON: Record<string, string> = {
  flight: "✈️",
  hotel: "🏨",
  activity: "🎯",
  transport: "🚗",
  car_rental: "🚗",
};

const TYPE_COLOR: Record<string, string> = {
  flight: "#3b82f6",
  hotel: "#8b5cf6",
  activity: "#10b981",
  transport: "#f59e0b",
  car_rental: "#f59e0b",
};

const FLIGHT_STATUS_STYLE: Record<string, React.CSSProperties> = {
  scheduled: { background: "rgba(156,163,175,0.15)", color: "#9ca3af" },
  "on-time":  { background: "rgba(34,197,94,0.15)",  color: "#4ade80" },
  delayed:    { background: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  cancelled:  { background: "rgba(239,68,68,0.15)",   color: "#f87171" },
  landed:     { background: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
};

const POI_ICON: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  museum: "🏛️",
  hotel: "🏨",
  attraction: "🎡",
  park: "🌿",
  shopping: "🛍️",
  transport: "🚂",
  "unesco site": "🏺",
  winery: "🍷",
  landmark: "🗽",
  "dive site": "🤿",
  other: "📍",
};

const COVER_EMOJIS = ["✈️","🏖️","🏔️","🗼","🌍","🏝️","🎭","🍜","🏕️","🎿","🚢","🌺"];

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const isErr = msg.startsWith("Error");
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: isErr ? "rgba(239,68,68,0.9)" : "rgba(34,197,94,0.9)",
      color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 14,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)", maxWidth: 340,
    }}>
      {msg}
      <button onClick={onClose} style={{ marginLeft: 12, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>×</button>
    </div>
  );
}

// ── Event form ────────────────────────────────────────────────────────────────

const EMPTY_EVENT = {
  type: "flight",
  title: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: "",
  address: "",
  bookingRef: "",
  confirmationNum: "",
  notes: "",
  flightNumber: "",
  airline: "",
  fromAirport: "",
  toAirport: "",
};

function EventForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [f, setF] = useState<any>(() => {
    if (!initial) return { ...EMPTY_EVENT };
    const start = initial.startTime ? new Date(initial.startTime) : null;
    const end = initial.endTime ? new Date(initial.endTime) : null;
    return {
      type: initial.type || "flight",
      title: initial.title || "",
      startDate: start ? start.toISOString().slice(0, 10) : "",
      startTime: start ? start.toISOString().slice(11, 16) : "",
      endDate: end ? end.toISOString().slice(0, 10) : "",
      endTime: end ? end.toISOString().slice(11, 16) : "",
      location: initial.location || "",
      address: initial.address || "",
      bookingRef: initial.bookingRef || "",
      confirmationNum: initial.confirmationNum || "",
      notes: initial.notes || "",
      flightNumber: initial.flightNumber || "",
      airline: initial.airline || "",
      fromAirport: initial.fromAirport || "",
      toAirport: initial.toAirport || "",
    };
  });

  const set = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      type: f.type,
      title: f.title,
      location: f.location,
      address: f.address,
      bookingRef: f.bookingRef,
      confirmationNum: f.confirmationNum,
      notes: f.notes,
    };
    if (f.startDate) {
      payload.startTime = f.startTime
        ? new Date(`${f.startDate}T${f.startTime}`).toISOString()
        : new Date(f.startDate).toISOString();
    }
    if (f.endDate) {
      payload.endTime = f.endTime
        ? new Date(`${f.endDate}T${f.endTime}`).toISOString()
        : new Date(f.endDate).toISOString();
    }
    if (f.type === "flight") {
      payload.flightNumber = f.flightNumber;
      payload.airline = f.airline;
      payload.fromAirport = f.fromAirport;
      payload.toAirport = f.toAirport;
    }
    onSubmit(payload);
  };

  const isFlight = f.type === "flight";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Label>Type</Label>
        <select
          value={f.type}
          onChange={e => set("type", e.target.value)}
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 6, padding: "6px 10px", fontSize: 14, width: "100%" }}
        >
          <option value="flight">Flight</option>
          <option value="hotel">Hotel</option>
          <option value="activity">Activity</option>
          <option value="transport">Transport</option>
          <option value="car_rental">Car Rental</option>
        </select>
      </div>
      <div>
        <Label>Title</Label>
        <Input value={f.title} onChange={e => set("title", e.target.value)} required placeholder="Event title" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={f.startDate} onChange={e => set("startDate", e.target.value)} />
        </div>
        <div>
          <Label>Start Time</Label>
          <Input type="time" value={f.startTime} onChange={e => set("startTime", e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={f.endDate} onChange={e => set("endDate", e.target.value)} />
        </div>
        <div>
          <Label>End Time</Label>
          <Input type="time" value={f.endTime} onChange={e => set("endTime", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Location</Label>
        <Input value={f.location} onChange={e => set("location", e.target.value)} placeholder="City or venue" />
      </div>
      <div>
        <Label>Address</Label>
        <Input value={f.address} onChange={e => set("address", e.target.value)} placeholder="Street address" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Booking Ref</Label>
          <Input value={f.bookingRef} onChange={e => set("bookingRef", e.target.value)} placeholder="e.g. ABC123" />
        </div>
        <div>
          <Label>Confirmation #</Label>
          <Input value={f.confirmationNum} onChange={e => set("confirmationNum", e.target.value)} placeholder="Confirm number" />
        </div>
      </div>
      {isFlight && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label>Flight Number</Label>
              <Input value={f.flightNumber} onChange={e => set("flightNumber", e.target.value)} placeholder="e.g. UA123" />
            </div>
            <div>
              <Label>Airline</Label>
              <Input value={f.airline} onChange={e => set("airline", e.target.value)} placeholder="e.g. United" />
            </div>
            <div>
              <Label>From (IATA)</Label>
              <Input value={f.fromAirport} onChange={e => set("fromAirport", e.target.value)} placeholder="SFO" maxLength={3} />
            </div>
            <div>
              <Label>To (IATA)</Label>
              <Input value={f.toAirport} onChange={e => set("toAirport", e.target.value)} placeholder="JFK" maxLength={3} />
            </div>
          </div>
        </>
      )}
      <div>
        <Label>Notes</Label>
        <textarea
          value={f.notes}
          onChange={e => set("notes", e.target.value)}
          rows={2}
          placeholder="Any notes..."
          style={{
            width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
            color: "var(--text-primary)", borderRadius: 6, padding: "8px 10px", fontSize: 14, resize: "vertical",
          }}
        />
      </div>
      {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn type="submit" variant="primary" disabled={loading}>{loading ? "Saving…" : "Save Event"}</Btn>
        <Btn type="button" variant="default" onClick={onCancel}>Cancel</Btn>
      </div>
    </form>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────────

function EventCard({
  event,
  tripId,
  onUpdated,
  onDeleted,
  onToast,
}: {
  event: any;
  tripId: string;
  onUpdated: () => void;
  onDeleted: () => void;
  onToast: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [tracking, setTracking] = useState(false);
  const [checking, setChecking] = useState(false);

  const isFlight = event.type === "flight";
  const isTracked = event.tracked;

  const handleSave = async (data: any) => {
    setSaving(true); setSaveErr("");
    try {
      await api.updateTravelEvent(tripId, event.id, data);
      setEditing(false);
      onUpdated();
    } catch (e: any) {
      setSaveErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    try {
      await api.deleteTravelEvent(tripId, event.id);
      onDeleted();
    } catch {
      onToast("Error: Failed to delete event");
    }
  };

  const handleTrack = async () => {
    setTracking(true);
    try {
      await api.trackFlight(tripId, event.id);
      onUpdated();
      onToast("Flight tracking enabled");
    } catch {
      onToast("Error: Failed to track flight");
    } finally {
      setTracking(false);
    }
  };

  const handleUntrack = async () => {
    setTracking(true);
    try {
      await api.untrackFlight(tripId, event.id);
      onUpdated();
      onToast("Flight tracking disabled");
    } catch {
      onToast("Error: Failed to untrack flight");
    } finally {
      setTracking(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const result = await api.checkFlight(tripId, event.id);
      onUpdated();
      onToast(`Flight status: ${result?.flightStatus || "updated"}`);
    } catch {
      onToast("Error: Failed to check flight");
    } finally {
      setChecking(false);
    }
  };

  const nights = event.type === "hotel" ? nightCount(event.startTime, event.endTime) : 0;
  const statusStyle = FLIGHT_STATUS_STYLE[event.flightStatus] || FLIGHT_STATUS_STYLE.scheduled;

  if (editing) {
    return (
      <div style={{ padding: "16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 10 }}>
        <div style={{ marginBottom: 12, fontWeight: 600, color: "var(--text-primary)" }}>Edit Event</div>
        <EventForm initial={event} onSubmit={handleSave} onCancel={() => setEditing(false)} loading={saving} error={saveErr} />
      </div>
    );
  }

  return (
    <div style={{
      padding: "14px 16px",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      marginBottom: 10,
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          fontSize: 22, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          background: `${TYPE_COLOR[event.type] || "#6b7280"}22`, borderRadius: 8, flexShrink: 0,
        }}>
          {TYPE_ICON[event.type] || "📅"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{event.title}</span>
            {isFlight && event.flightStatus && (
              <span style={{ ...statusStyle, fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 500 }}>
                {event.flightStatus}
              </span>
            )}
            {isFlight && event.delayMinutes > 0 && (
              <span style={{ fontSize: 11, color: "#fbbf24" }}>+{event.delayMinutes}min delay</span>
            )}
          </div>
          {isFlight && event.fromAirport && event.toAirport && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {event.flightNumber && <span style={{ marginRight: 8, fontWeight: 500 }}>{event.flightNumber}</span>}
              {event.airline && <span style={{ marginRight: 8 }}>{event.airline}</span>}
              <span style={{ fontWeight: 600 }}>{event.fromAirport}</span>
              <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>→</span>
              <span style={{ fontWeight: 600 }}>{event.toAirport}</span>
            </div>
          )}
          {(event.location || event.address) && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {event.location}{event.address ? (event.location ? ` — ${event.address}` : event.address) : ""}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {event.startTime && <span>{fmtDate(event.startTime)} {fmtTime(event.startTime)}</span>}
            {event.endTime && <span>→ {fmtTime(event.endTime)}</span>}
            {nights > 0 && <span style={{ color: "var(--accent)" }}>{nights} night{nights !== 1 ? "s" : ""}</span>}
          </div>
          {(event.gate || event.terminal) && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {event.terminal && <span>Terminal {event.terminal}</span>}
              {event.gate && <span style={{ marginLeft: event.terminal ? 8 : 0 }}>Gate {event.gate}</span>}
            </div>
          )}
          {(event.bookingRef || event.confirmationNum) && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {event.bookingRef && <span>Ref: <strong style={{ color: "var(--text-secondary)" }}>{event.bookingRef}</strong></span>}
              {event.confirmationNum && <span style={{ marginLeft: event.bookingRef ? 10 : 0 }}>Conf: <strong style={{ color: "var(--text-secondary)" }}>{event.confirmationNum}</strong></span>}
            </div>
          )}
          {event.notes && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>{event.notes}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {isFlight && !isTracked && (
              <button
                onClick={handleTrack}
                disabled={tracking}
                style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, border: "1px solid #3b82f6", background: "rgba(59,130,246,0.1)", color: "#60a5fa", cursor: "pointer" }}
              >
                {tracking ? "…" : "Track"}
              </button>
            )}
            {isFlight && isTracked && (
              <>
                <button
                  onClick={handleUntrack}
                  disabled={tracking}
                  style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                  {tracking ? "…" : "Untrack"}
                </button>
                <button
                  onClick={handleCheck}
                  disabled={checking}
                  style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, border: "1px solid #3b82f6", background: "rgba(59,130,246,0.1)", color: "#60a5fa", cursor: "pointer" }}
                >
                  {checking ? "Checking…" : "Check now"}
                </button>
              </>
            )}
            <button
              onClick={() => setEditing(true)}
              style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-secondary)", cursor: "pointer" }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TripDetail ────────────────────────────────────────────────────────────────

function TripDetail({
  trip,
  onBack,
  onUpdated,
  onDeleted,
  onToast,
}: {
  trip: any;
  onBack: () => void;
  onUpdated: (t: any) => void;
  onDeleted: () => void;
  onToast: (msg: string) => void;
}) {
  const [detail, setDetail] = useState<any>(trip);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDest, setEditingDest] = useState(false);
  const [nameVal, setNameVal] = useState(trip.name);
  const [destVal, setDestVal] = useState(trip.destination || "");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const t = await api.getTravelTrip(detail.id);
      setDetail(t);
      onUpdated(t);
    } catch {
      onToast("Error: Failed to reload trip");
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    try {
      const t = await api.updateTravelTrip(detail.id, { name: nameVal });
      setDetail((p: any) => ({ ...p, name: nameVal }));
      onUpdated(t);
    } catch { onToast("Error: Failed to save name"); }
    setEditingName(false);
  };

  const saveDest = async () => {
    try {
      const t = await api.updateTravelTrip(detail.id, { destination: destVal });
      setDetail((p: any) => ({ ...p, destination: destVal }));
      onUpdated(t);
    } catch { onToast("Error: Failed to save destination"); }
    setEditingDest(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete trip "${detail.name}"?`)) return;
    setDeleting(true);
    try {
      await api.deleteTravelTrip(detail.id);
      onDeleted();
    } catch {
      onToast("Error: Failed to delete trip");
      setDeleting(false);
    }
  };

  const handleScanEmails = async () => {
    setScanLoading(true);
    try {
      const result = await api.ingestTravelEmails();
      onToast(`Scanned emails: ${result?.added ?? 0} events added`);
      await reload();
    } catch {
      onToast("Error: Email scan failed");
    } finally {
      setScanLoading(false);
    }
  };

  const handleAddEvent = async (data: any) => {
    setAddLoading(true); setAddError("");
    try {
      await api.addTravelEvent(detail.id, data);
      setShowAddEvent(false);
      await reload();
    } catch (e: any) {
      setAddError(e?.message || "Failed to add event");
    } finally {
      setAddLoading(false);
    }
  };

  const events: any[] = [...(detail.events || [])].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <div>
      <button onClick={onBack} style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
        ← Back to trips
      </button>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 40 }}>{detail.coverEmoji || "✈️"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <Input value={nameVal} onChange={e => setNameVal(e.target.value)} style={{ fontSize: 20, fontWeight: 700, padding: "4px 8px" }} autoFocus />
                <Btn variant="primary" onClick={saveName}>Save</Btn>
                <Btn variant="default" onClick={() => setEditingName(false)}>Cancel</Btn>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{detail.name}</h2>
                <button onClick={() => setEditingName(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14 }}>✏️</button>
              </div>
            )}
            {editingDest ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <Input value={destVal} onChange={e => setDestVal(e.target.value)} style={{ fontSize: 14 }} placeholder="Destination" autoFocus />
                <Btn variant="primary" onClick={saveDest}>Save</Btn>
                <Btn variant="default" onClick={() => setEditingDest(false)}>Cancel</Btn>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{detail.destination || "No destination"}</span>
                <button onClick={() => setEditingDest(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>✏️</button>
              </div>
            )}
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {fmtRange(detail.startDate, detail.endDate)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn variant="default" onClick={handleScanEmails} disabled={scanLoading}>
              {scanLoading ? "Scanning…" : "📧 Scan emails"}
            </Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete trip"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Events */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          Events {loading && <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>loading…</span>}
        </div>
        <Btn variant="primary" onClick={() => setShowAddEvent(v => !v)}>
          {showAddEvent ? "Cancel" : "+ Add Event"}
        </Btn>
      </div>

      {showAddEvent && (
        <div style={{ marginBottom: 20, padding: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>New Event</div>
          <EventForm onSubmit={handleAddEvent} onCancel={() => setShowAddEvent(false)} loading={addLoading} error={addError} />
        </div>
      )}

      {events.length === 0 && !showAddEvent && (
        <EmptyState>No events yet. Add your first flight, hotel, or activity.</EmptyState>
      )}

      {events.map((ev: any) => (
        <EventCard
          key={ev.id}
          event={ev}
          tripId={detail.id}
          onUpdated={reload}
          onDeleted={reload}
          onToast={onToast}
        />
      ))}
    </div>
  );
}

// ── TripsTab ──────────────────────────────────────────────────────────────────

function TripsTab({ onToast }: { onToast: (msg: string) => void }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const t = await api.getTravelTrips();
      setTrips(Array.isArray(t) ? t : []);
    } catch {
      onToast("Error: Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = trips.find(t => t.id === selectedId) || null;

  const now = new Date();
  const upcoming = trips.filter(t => !t.endDate || new Date(t.endDate) >= now);
  const past = trips.filter(t => t.endDate && new Date(t.endDate) < now);

  const statusColor = (s: string): "green" | "blue" | "amber" | "gray" => {
    if (s === "active" || s === "ongoing") return "green";
    if (s === "planned") return "blue";
    if (s === "completed") return "gray";
    return "amber";
  };

  const TripCard = ({ trip }: { trip: any }) => (
    <div
      onClick={() => setSelectedId(trip.id)}
      style={{
        padding: "12px 14px",
        background: selectedId === trip.id ? "var(--accent-bg)" : "var(--bg-card)",
        border: `1px solid ${selectedId === trip.id ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 10,
        cursor: "pointer",
        marginBottom: 8,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{trip.coverEmoji || "✈️"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {trip.name}
            <Badge color={statusColor(trip.status)}>{trip.status || "planned"}</Badge>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{trip.destination || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{fmtRange(trip.startDate, trip.endDate)}</div>
          {trip._count?.events != null && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{trip._count.events} event{trip._count.events !== 1 ? "s" : ""}</div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return <div style={{ color: "var(--text-muted)", padding: 20 }}>Loading trips…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
      {/* Left: Trip list */}
      <div>
        {trips.length === 0 && <EmptyState>No trips yet. Create one in "New Trip".</EmptyState>}
        {upcoming.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Upcoming</div>
            {upcoming.map(t => <TripCard key={t.id} trip={t} />)}
          </>
        )}
        {past.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, marginTop: upcoming.length > 0 ? 16 : 0 }}>Past</div>
            {past.map(t => <TripCard key={t.id} trip={t} />)}
          </>
        )}
      </div>

      {/* Right: Detail */}
      <div>
        {selected ? (
          <TripDetail
            trip={selected}
            onBack={() => setSelectedId(null)}
            onUpdated={updated => setTrips(ts => ts.map(t => t.id === updated.id ? { ...t, ...updated } : t))}
            onDeleted={() => { setSelectedId(null); load(); }}
            onToast={onToast}
          />
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
            <p>Select a trip to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CalendarTab ───────────────────────────────────────────────────────────────

function CalendarTab({ onToast }: { onToast: (msg: string) => void }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ ev: any; x: number; y: number } | null>(null);

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  useEffect(() => {
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    setLoading(true);
    api.getTravelCalendar(from, to)
      .then((data: any) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => onToast("Error: Failed to load calendar"))
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // Build day grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Mon=0 offset
  const startDow = (firstDay.getDay() + 6) % 7; // Monday-based
  const totalDays = lastDay.getDate();

  const cells: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
  // prev month filler
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    cells.push({ date: d, isCurrentMonth: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // fill to complete week
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - totalDays - startDow + 1);
    cells.push({ date: d, isCurrentMonth: false });
  }

  // Map events to days
  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const eventsByDay: Record<string, any[]> = {};
  events.forEach(ev => {
    if (!ev.startTime) return;
    const k = dayKey(new Date(ev.startTime));
    if (!eventsByDay[k]) eventsByDay[k] = [];
    eventsByDay[k].push(ev);
  });

  const isToday = (d: Date) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  return (
    <div onClick={() => setPopup(null)}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="default" onClick={prevMonth}>←</Btn>
        <h3 style={{ flex: 1, textAlign: "center", margin: 0, fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          {monthNames[month]} {year}
        </h3>
        <Btn variant="default" onClick={nextMonth}>→</Btn>
        <Btn variant="default" onClick={goToday}>Today</Btn>
        {loading && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading…</span>}
      </div>

      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;
          const k = dayKey(cell.date);
          const dayEvents = eventsByDay[k] || [];
          return (
            <div
              key={i}
              style={{
                minHeight: 80,
                padding: "6px 4px",
                background: isToday(cell.date) ? "var(--accent-bg)" : "var(--bg-card)",
                border: `1px solid ${isToday(cell.date) ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 6,
                opacity: cell.isCurrentMonth ? 1 : 0.4,
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: isToday(cell.date) ? 700 : 400,
                color: isToday(cell.date) ? "var(--accent)" : "var(--text-secondary)",
                marginBottom: 4,
              }}>
                {cell.date.getDate()}
              </div>
              {dayEvents.slice(0, 3).map((ev: any, ei: number) => (
                <div
                  key={ei}
                  onClick={e => { e.stopPropagation(); setPopup({ ev, x: (e.target as HTMLElement).getBoundingClientRect().left, y: (e.target as HTMLElement).getBoundingClientRect().bottom }); }}
                  title={ev.title}
                  style={{
                    fontSize: 10,
                    padding: "2px 4px",
                    borderRadius: 3,
                    marginBottom: 2,
                    background: `${TYPE_COLOR[ev.type] || "#6b7280"}33`,
                    color: TYPE_COLOR[ev.type] || "#9ca3af",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: "pointer",
                  }}
                >
                  {TYPE_ICON[ev.type] || "📅"} {(ev.title || "").slice(0, 15)}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>+{dayEvents.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Popup */}
      {popup && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "fixed",
            top: Math.min(popup.y + 8, window.innerHeight - 200),
            left: Math.min(popup.x, window.innerWidth - 260),
            zIndex: 999,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 14,
            width: 240,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, fontSize: 14 }}>
            {TYPE_ICON[popup.ev.type]} {popup.ev.title}
          </div>
          {popup.ev.tripName && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              {popup.ev.tripEmoji} {popup.ev.tripName}
            </div>
          )}
          {popup.ev.startTime && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
              {fmtDate(popup.ev.startTime)} {fmtTime(popup.ev.startTime)}
            </div>
          )}
          {popup.ev.bookingRef && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Ref: {popup.ev.bookingRef}</div>
          )}
          <button
            onClick={() => setPopup(null)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── MemoryTab ─────────────────────────────────────────────────────────────────

function MemoryTab({ onToast }: { onToast: (msg: string) => void }) {
  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPoi, setEditingPoi] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", address: "", city: "", country: "",
    category: "other", notes: "", visitedAt: "", lat: "", lng: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterCategory) params.category = filterCategory;
      if (filterCountry) params.country = filterCountry;
      const data = await api.getTravelPOIs(params);
      setPois(Array.isArray(data) ? data : []);
    } catch {
      onToast("Error: Failed to load places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterCategory, filterCountry]);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleAddPoi = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setFormError("");
    try {
      const payload: any = {
        name: form.name,
        address: form.address,
        city: form.city,
        country: form.country,
        category: form.category,
        notes: form.notes,
        visitedAt: form.visitedAt || undefined,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      };
      if (editingPoi) {
        await api.updateTravelPOI(editingPoi.id, payload);
        onToast("Place updated");
      } else {
        await api.createTravelPOI(payload);
        onToast("Place added");
      }
      setShowAdd(false);
      setEditingPoi(null);
      setForm({ name: "", address: "", city: "", country: "", category: "other", notes: "", visitedAt: "", lat: "", lng: "" });
      await load();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (poi: any) => {
    setEditingPoi(poi);
    setForm({
      name: poi.name || "",
      address: poi.address || "",
      city: poi.city || "",
      country: poi.country || "",
      category: poi.category || "other",
      notes: poi.notes || "",
      visitedAt: poi.visitedAt ? poi.visitedAt.slice(0, 10) : "",
      lat: poi.lat != null ? String(poi.lat) : "",
      lng: poi.lng != null ? String(poi.lng) : "",
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this place?")) return;
    try {
      await api.deleteTravelPOI(id);
      setPois(p => p.filter(x => x.id !== id));
      onToast("Place deleted");
    } catch {
      onToast("Error: Failed to delete place");
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      const result = await api.uploadTravelFile(file);
      onToast(`Imported: ${result?.imported ?? 0} places`);
      await load();
    } catch {
      onToast("Error: File import failed");
    } finally {
      setUploadLoading(false);
    }
  };

  // Group by country → city
  const grouped: Record<string, Record<string, any[]>> = {};
  pois.forEach(p => {
    const c = p.country || "Unknown";
    const city = p.city || "Unknown";
    if (!grouped[c]) grouped[c] = {};
    if (!grouped[c][city]) grouped[c][city] = [];
    grouped[c][city].push(p);
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Label>Filter by country</Label>
          <Input value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="e.g. France" />
        </div>
        <div style={{ minWidth: 160 }}>
          <Label>Category</Label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 6, padding: "8px 10px", fontSize: 14, width: "100%" }}
          >
            <option value="">All categories</option>
            {Object.keys(POI_ICON).map(k => <option key={k} value={k}>{POI_ICON[k]} {k}</option>)}
          </select>
        </div>
        <Btn variant="primary" onClick={() => { setEditingPoi(null); setForm({ name: "", address: "", city: "", country: "", category: "other", notes: "", visitedAt: "", lat: "", lng: "" }); setShowAdd(true); }}>
          + Add place
        </Btn>
      </div>

      {/* Add/Edit form slide-in */}
      {showAdd && (
        <div style={{ marginBottom: 24, padding: 20, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
            {editingPoi ? "Edit Place" : "Add New Place"}
          </div>
          <form onSubmit={handleAddPoi} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setF("name", e.target.value)} required placeholder="Place name" />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={e => setF("category", e.target.value)}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 6, padding: "8px 10px", fontSize: 14, width: "100%" }}
                >
                  {Object.keys(POI_ICON).map(k => <option key={k} value={k}>{POI_ICON[k]} {k}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setF("address", e.target.value)} placeholder="Street address" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={e => setF("city", e.target.value)} placeholder="City" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={e => setF("country", e.target.value)} placeholder="Country" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <Label>Visited At</Label>
                <Input type="date" value={form.visitedAt} onChange={e => setF("visitedAt", e.target.value)} />
              </div>
              <div>
                <Label>Lat (optional)</Label>
                <Input value={form.lat} onChange={e => setF("lat", e.target.value)} placeholder="48.8566" type="number" step="any" />
              </div>
              <div>
                <Label>Lng (optional)</Label>
                <Input value={form.lng} onChange={e => setF("lng", e.target.value)} placeholder="2.3522" type="number" step="any" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={e => setF("notes", e.target.value)}
                rows={2}
                placeholder="Any notes…"
                style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 6, padding: "8px 10px", fontSize: 14, resize: "vertical" }}
              />
            </div>
            {formError && <p style={{ color: "#f87171", fontSize: 13 }}>{formError}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn type="submit" variant="primary" disabled={formLoading}>{formLoading ? "Saving…" : (editingPoi ? "Update Place" : "Add Place")}</Btn>
              <Btn type="button" variant="default" onClick={() => { setShowAdd(false); setEditingPoi(null); }}>Cancel</Btn>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 20 }}>Loading places…</div>
      ) : pois.length === 0 ? (
        <EmptyState>No places saved yet. Add your first memory.</EmptyState>
      ) : (
        Object.entries(grouped).map(([country, cities]) => (
          <div key={country} style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 12 }}>{country}</div>
            {Object.entries(cities).map(([city, cityPois]) => (
              <div key={city} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{city}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {cityPois.map((poi: any) => (
                    <div
                      key={poi.id}
                      style={{ position: "relative", padding: 14, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}
                      className="poi-card"
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{POI_ICON[poi.category] || "📍"}</div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>{poi.name}</div>
                      {poi.address && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{poi.address}</div>}
                      {poi.visitedAt && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Visited: {fmtDate(poi.visitedAt)}</div>}
                      {poi.notes && <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{poi.notes.slice(0, 80)}{poi.notes.length > 80 ? "…" : ""}</div>}
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button onClick={() => handleEdit(poi)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-secondary)", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(poi.id)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* File upload */}
      <div style={{ marginTop: 32, padding: 20, background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: 12 }}>
        <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Import past places</div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Upload a .json or .csv file to import places.</p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
        />
        <Btn variant="default" onClick={() => fileRef.current?.click()} disabled={uploadLoading}>
          {uploadLoading ? "Uploading…" : "Choose file"}
        </Btn>
      </div>
    </div>
  );
}

// ── NewTripTab ────────────────────────────────────────────────────────────────

function NewTripTab({
  onCreated,
  onToast,
}: {
  onCreated: (trip: any) => void;
  onToast: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    coverEmoji: "✈️",
    name: "",
    destination: "",
    homeAirport: "SFO",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [scanLoading, setScanLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError("");
    try {
      const trip = await api.createTravelTrip({
        coverEmoji: form.coverEmoji,
        name: form.name,
        destination: form.destination,
        homeAirport: form.homeAirport,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        notes: form.notes,
      });
      onToast(`Trip "${form.name}" created!`);
      onCreated(trip);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create trip");
    } finally {
      setCreating(false);
    }
  };

  const handleScanEmails = async () => {
    setScanLoading(true);
    try {
      const result = await api.ingestTravelEmails();
      onToast(`Scanned emails: ${result?.added ?? 0} events found`);
    } catch {
      onToast("Error: Email scan failed");
    } finally {
      setScanLoading(false);
    }
  };

  const handleFileImport = async (file: File) => {
    setImportLoading(true);
    try {
      const result = await api.uploadTravelFile(file);
      onToast(`Imported ${result?.trips ?? 0} trip(s) and ${result?.pois ?? 0} place(s)`);
    } catch {
      onToast("Error: Import failed");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
      {/* Create manually */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 16 }}>Create manually</div>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Label>Cover emoji</Label>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(v => !v)}
                style={{ fontSize: 28, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}
              >
                {form.coverEmoji}
              </button>
              {showEmojiPicker && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
                  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                  padding: 10, display: "flex", flexWrap: "wrap", gap: 6, width: 220,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}>
                  {COVER_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => { setF("coverEmoji", em); setShowEmojiPicker(false); }}
                      style={{ fontSize: 22, background: form.coverEmoji === em ? "var(--accent-bg)" : "none", border: "1px solid transparent", borderRadius: 6, padding: 4, cursor: "pointer" }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Trip name *</Label>
            <Input value={form.name} onChange={e => setF("name", e.target.value)} required placeholder="e.g. Paris Summer 2025" />
          </div>
          <div>
            <Label>Destination</Label>
            <Input value={form.destination} onChange={e => setF("destination", e.target.value)} placeholder="e.g. Paris, France" />
          </div>
          <div>
            <Label>Home airport (IATA)</Label>
            <Input value={form.homeAirport} onChange={e => setF("homeAirport", e.target.value)} placeholder="SFO" maxLength={4} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label>Start date</Label>
              <Input type="date" value={form.startDate} onChange={e => setF("startDate", e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={form.endDate} onChange={e => setF("endDate", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={e => setF("notes", e.target.value)}
              rows={3}
              placeholder="Anything to remember…"
              style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 6, padding: "8px 10px", fontSize: 14, resize: "vertical" }}
            />
          </div>
          {createError && <p style={{ color: "#f87171", fontSize: 13 }}>{createError}</p>}
          <Btn type="submit" variant="primary" disabled={creating}>{creating ? "Creating…" : "Create Trip"}</Btn>
        </form>
      </div>

      {/* Import */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 16 }}>Import from file</div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileImport(file);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "var(--accent-bg)" : "transparent",
            transition: "all 0.15s",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 4 }}>
            {importLoading ? "Importing…" : "Drag & drop a .json or .csv file"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>or click to browse</div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileImport(f); }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Btn variant="default" onClick={handleScanEmails} disabled={scanLoading} style={{ width: "100%" }}>
            {scanLoading ? "Scanning emails…" : "📧 Or scan your emails"}
          </Btn>
          {scanLoading && (
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              Scanning inbox for travel confirmations…
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>JSON format hint</div>
          <pre style={{
            fontSize: 11, color: "var(--text-muted)", margin: 0,
            background: "var(--bg-input)", padding: 10, borderRadius: 6, overflowX: "auto",
            fontFamily: "monospace",
          }}>{`{
  "trips": [{
    "name": "Paris 2024",
    "destination": "Paris",
    "startDate": "2024-06-01",
    "endDate": "2024-06-10",
    "events": [...]
  }],
  "pois": [...]
}`}</pre>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "trips" | "calendar" | "memory" | "new";

export default function Travel({ profile }: Props) {
  const [tab, setTab] = useState<Tab>("trips");
  const [toast, setToast] = useState<string | null>(null);
  const [forcedTripId, setForcedTripId] = useState<string | null>(null);

  const showToast = (msg: string) => setToast(msg);

  const handleTripCreated = (_trip: any) => {
    setTab("trips");
    // The Trips tab will reload on mount/focus
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "trips", label: "✈️ Trips" },
    { key: "calendar", label: "📅 Calendar" },
    { key: "memory", label: "📍 Memory" },
    { key: "new", label: "+ New Trip" },
  ];

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 16px 48px" }}>
      <PageTitle>Travel Planner</PageTitle>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
              cursor: "pointer",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "trips" && <TripsTab onToast={showToast} key={forcedTripId || "trips"} />}
      {tab === "calendar" && <CalendarTab onToast={showToast} />}
      {tab === "memory" && <MemoryTab onToast={showToast} />}
      {tab === "new" && <NewTripTab onCreated={handleTripCreated} onToast={showToast} />}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
