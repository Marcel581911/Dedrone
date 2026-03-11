import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { PageTitle, Btn, Input, Label } from "../components/ui";

type View = "month" | "week";

const HOUR_HEIGHT = 52; // px per hour in week grid
const DAY_START = 6;   // 6:00
const DAY_END = 22;    // 22:00

const EVENT_COLORS = [
  { key: "", label: "Gold",   bg: "rgba(229,162,16,0.18)", text: "var(--accent)",  border: "rgba(229,162,16,0.5)" },
  { key: "blue",   label: "Blue",   bg: "rgba(59,130,246,0.18)",  text: "#60a5fa", border: "rgba(59,130,246,0.5)" },
  { key: "green",  label: "Green",  bg: "rgba(34,197,94,0.18)",   text: "#4ade80", border: "rgba(34,197,94,0.5)" },
  { key: "red",    label: "Red",    bg: "rgba(239,68,68,0.18)",   text: "#f87171", border: "rgba(239,68,68,0.5)" },
  { key: "purple", label: "Purple", bg: "rgba(168,85,247,0.18)",  text: "#c084fc", border: "rgba(168,85,247,0.5)" },
  { key: "orange", label: "Orange", bg: "rgba(249,115,22,0.18)",  text: "#fb923c", border: "rgba(249,115,22,0.5)" },
];

function getColor(key: string) {
  return EVENT_COLORS.find(c => c.key === (key || "")) || EVENT_COLORS[0];
}

// ── Timezone utils ──────────────────────────────────────

function fmtInTz(date: Date | string, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("default", { ...opts, timeZone: tz }).format(new Date(date));
}

// Returns "YYYY-MM-DD" in the given timezone
function toDateKey(date: Date | string, tz: string): string {
  return fmtInTz(date, tz, { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2"); // MM/DD/YYYY → YYYY-MM-DD
}

// Returns hour + minute fraction (e.g. 9.5 = 9:30) in the given timezone
function toHourFraction(date: Date | string, tz: string): number {
  const d = new Date(date);
  const h = parseInt(fmtInTz(d, tz, { hour: "2-digit", hour12: false }));
  const m = parseInt(fmtInTz(d, tz, { minute: "2-digit" }));
  return h + m / 60;
}

// Convert a local datetime-local input value to ISO UTC string
function localInputToISO(val: string): string {
  if (!val) return "";
  return new Date(val).toISOString();
}

// Convert a UTC ISO string to local datetime-local input value
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Main component ──────────────────────────────────────

export default function Calendar() {
  const [view, setView] = useState<View>("month");
  const [current, setCurrent] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [weekBase, setWeekBase] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    d.setHours(0,0,0,0);
    return d;
  });
  const [events, setEvents] = useState<any[]>([]);
  const [userTz, setUserTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [modal, setModal] = useState<any>(null); // null=closed, {}=new, event=edit
  const [form, setForm] = useState({ title: "", description: "", startAt: "", endAt: "", location: "", allDay: false, color: "" });
  const [saving, setSaving] = useState(false);
  const nowLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getMe().then((u) => { if (u?.timezone) setUserTz(u.timezone); }).catch(() => {});
  }, []);

  const loadEvents = () => {
    let start: Date, end: Date;
    if (view === "month") {
      start = new Date(current.getFullYear(), current.getMonth(), 1);
      end = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    } else {
      start = new Date(weekBase);
      end = new Date(weekBase); end.setDate(end.getDate() + 7);
    }
    api.getEvents(start.toISOString(), end.toISOString()).then(setEvents);
  };

  useEffect(() => { loadEvents(); }, [view, current, weekBase, userTz]);

  // Scroll week view to current time on mount
  useEffect(() => {
    if (view === "week" && nowLineRef.current) {
      setTimeout(() => nowLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [view]);

  const openNew = (dateStr?: string) => {
    const base = dateStr ? `${dateStr}T09:00` : isoToLocalInput(new Date().toISOString());
    setForm({ title: "", description: "", startAt: base, endAt: base.replace("T09:00", "T10:00"), location: "", allDay: false, color: "" });
    setModal({});
  };

  const openEdit = (e: any) => {
    setForm({
      title: e.title || "",
      description: e.description || "",
      startAt: isoToLocalInput(e.startAt),
      endAt: e.endAt ? isoToLocalInput(e.endAt) : "",
      location: e.location || "",
      allDay: e.allDay || false,
      color: e.color || "",
    });
    setModal(e);
  };

  const save = async () => {
    if (!form.title.trim() || !form.startAt) return;
    setSaving(true);
    try {
      const data = {
        title: form.title,
        description: form.description,
        startAt: localInputToISO(form.startAt),
        endAt: form.endAt ? localInputToISO(form.endAt) : null,
        location: form.location,
        allDay: form.allDay,
        color: form.color,
      };
      if (modal?.id) await api.updateEvent(modal.id, data);
      else await api.createEvent(data);
      setModal(null);
      loadEvents();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!modal?.id || !confirm("Delete this event?")) return;
    await api.deleteEvent(modal.id);
    setModal(null);
    loadEvents();
  };

  const navigate = (dir: number) => {
    if (view === "month") {
      setCurrent(new Date(current.getFullYear(), current.getMonth() + dir, 1));
    } else {
      const d = new Date(weekBase); d.setDate(d.getDate() + dir * 7); setWeekBase(d);
    }
  };

  const goToday = () => {
    const now = new Date();
    setCurrent(new Date(now.getFullYear(), now.getMonth(), 1));
    const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0,0,0,0);
    setWeekBase(d);
  };

  const tzShort = userTz.split("/").pop()?.replace(/_/g, " ") || userTz;
  const today = toDateKey(new Date(), userTz);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PageTitle>
            {view === "month"
              ? fmtInTz(current, userTz, { month: "long", year: "numeric" })
              : `Week of ${fmtInTz(weekBase, userTz, { month: "short", day: "numeric" })}`}
          </PageTitle>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
            {tzShort}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {(["month", "week"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs capitalize"
                style={{ background: view === v ? "var(--accent-bg)" : "var(--bg-input)", color: view === v ? "var(--accent)" : "var(--text-muted)" }}>
                {v}
              </button>
            ))}
          </div>
          <Btn onClick={() => navigate(-1)}>←</Btn>
          <Btn onClick={goToday}>Today</Btn>
          <Btn onClick={() => navigate(1)}>→</Btn>
          <Btn variant="primary" onClick={() => openNew()}>+ Event</Btn>
        </div>
      </div>

      {view === "month"
        ? <MonthView current={current} events={events} today={today} userTz={userTz} onDayClick={(dk) => { goToday(); setView("week"); }} onEventClick={openEdit} onEmptyClick={(dk) => openNew(dk)} />
        : <WeekView weekBase={weekBase} events={events} today={today} userTz={userTz} nowLineRef={nowLineRef} onEventClick={openEdit} onSlotClick={(dt) => openNew(isoToLocalInput(dt).slice(0,16))} />
      }

      {/* Event modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{modal?.id ? "Edit event" : "New event"}</h3>
              <button onClick={() => setModal(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div><Label>Title</Label><Input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allday" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} />
                <label htmlFor="allday" className="text-xs" style={{ color: "var(--text-secondary)" }}>All day</label>
              </div>
              {!form.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start</Label><Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} /></div>
                </div>
              )}
              {form.allDay && (
                <div><Label>Date</Label><Input type="date" value={form.startAt.slice(0,10)} onChange={(e) => setForm({ ...form, startAt: e.target.value + "T00:00", endAt: "" })} /></div>
              )}
              <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes..." rows={2} className="w-full rounded-md border px-3 py-2 text-sm" style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Optional" /></div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {EVENT_COLORS.map((c) => (
                    <button key={c.key} onClick={() => setForm({ ...form, color: c.key })}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c.bg, borderColor: form.color === c.key ? c.text : "transparent" }}
                      title={c.label} />
                  ))}
                </div>
              </div>
              {form.startAt && (
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Input times are in your browser's local timezone. Display is in {tzShort}.
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Btn variant="primary" onClick={save} disabled={saving || !form.title.trim()}>{saving ? "..." : modal?.id ? "Save" : "Add"}</Btn>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
              {modal?.id && <button onClick={remove} className="ml-auto text-xs px-3 py-1.5 rounded-md" style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>Delete</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Month view ──────────────────────────────────────────

function MonthView({ current, events, today, userTz, onDayClick, onEventClick, onEmptyClick }: {
  current: Date; events: any[]; today: string; userTz: string;
  onDayClick: (dk: string) => void; onEventClick: (e: any) => void; onEmptyClick: (dk: string) => void;
}) {
  const year = current.getFullYear();
  const month = current.getMonth();

  // Build grid: 6 weeks × 7 days, starting from Monday
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // days before month starts (Mon=0)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  });

  const eventsByDay: Record<string, any[]> = {};
  for (const e of events) {
    const dk = toDateKey(e.startAt, userTz);
    if (!eventsByDay[dk]) eventsByDay[dk] = [];
    eventsByDay[dk].push(e);
  }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium py-1" style={{ color: "var(--text-muted)" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px" style={{ background: "var(--border)" }}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} style={{ background: "var(--bg-root)", minHeight: 90 }} />;
          const dk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const isToday = dk === today;
          const dayEvents = (eventsByDay[dk] || []).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

          return (
            <div key={i} className="p-1.5 cursor-pointer hover:brightness-110 transition-all"
              style={{ background: "var(--bg-card)", minHeight: 90 }}
              onClick={() => onEmptyClick(dk)}>
              <div className="flex items-center justify-center w-6 h-6 rounded-full mb-1"
                style={{ background: isToday ? "var(--accent)" : "transparent" }}>
                <span className="text-xs font-medium" style={{ color: isToday ? "#000" : date.getMonth() !== month ? "var(--text-muted)" : "var(--text-secondary)" }}>
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const c = getColor(e.color);
                  return (
                    <div key={e.id} onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      className="rounded px-1 py-0.5 text-[10px] truncate hover:brightness-125"
                      style={{ background: c.bg, color: c.text }}>
                      {!e.allDay && <span className="opacity-70 mr-1">{fmtInTz(e.startAt, userTz, { hour: "2-digit", minute: "2-digit", hour12: false })}</span>}
                      {e.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] px-1" style={{ color: "var(--text-muted)" }}>+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week view ───────────────────────────────────────────

function WeekView({ weekBase, events, today, userTz, nowLineRef, onEventClick, onSlotClick }: {
  weekBase: Date; events: any[]; today: string; userTz: string;
  nowLineRef: React.RefObject<HTMLDivElement>; onEventClick: (e: any) => void; onSlotClick: (isoStr: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekBase); d.setDate(d.getDate() + i); return d;
  });
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

  // Current time position
  const nowFrac = toHourFraction(new Date(), userTz);
  const nowTop = (nowFrac - DAY_START) * HOUR_HEIGHT;
  const showNow = nowFrac >= DAY_START && nowFrac <= DAY_END;
  const todayIdx = days.findIndex(d => toDateKey(d, userTz) === today);

  // All-day events
  const allDayEvents = events.filter(e => e.allDay);
  const timedEvents = events.filter(e => !e.allDay);

  const eventsForDay = (d: Date) => {
    const dk = toDateKey(d, userTz);
    return timedEvents.filter(e => toDateKey(e.startAt, userTz) === dk);
  };

  return (
    <div>
      {/* Day headers */}
      <div className="grid border-b" style={{ gridTemplateColumns: "48px repeat(7, 1fr)", borderColor: "var(--border)" }}>
        <div />
        {days.map((d, i) => {
          const dk = toDateKey(d, userTz);
          const isToday = dk === today;
          return (
            <div key={i} className="text-center py-2 border-l" style={{ borderColor: "var(--border)" }}>
              <div className="text-[10px]" style={{ color: isToday ? "var(--accent)" : "var(--text-muted)" }}>{DAY_LABELS[i]}</div>
              <div className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full mx-auto`}
                style={{ background: isToday ? "var(--accent)" : "transparent", color: isToday ? "#000" : "var(--text-secondary)" }}>
                {fmtInTz(d, userTz, { day: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="grid border-b" style={{ gridTemplateColumns: "48px repeat(7, 1fr)", borderColor: "var(--border)" }}>
          <div className="text-[9px] py-1 pr-1 text-right" style={{ color: "var(--text-muted)" }}>all day</div>
          {days.map((d, i) => {
            const dk = toDateKey(d, userTz);
            const dayAllDay = allDayEvents.filter(e => toDateKey(e.startAt, userTz) === dk);
            const c = dayAllDay[0] ? getColor(dayAllDay[0].color) : null;
            return (
              <div key={i} className="border-l min-h-[22px] px-0.5 py-0.5" style={{ borderColor: "var(--border)" }}>
                {dayAllDay.map(e => {
                  const ec = getColor(e.color);
                  return (
                    <div key={e.id} onClick={() => onEventClick(e)} className="rounded px-1 text-[10px] truncate cursor-pointer hover:brightness-125 mb-0.5"
                      style={{ background: ec.bg, color: ec.text }}>{e.title}</div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <div className="relative grid" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
          {/* Hour labels */}
          <div>
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-0.5">
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{String(h).padStart(2,"0")}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const dayEvs = eventsForDay(d);
            const dk = toDateKey(d, userTz);
            const isToday = dk === today;

            return (
              <div key={di} className="relative border-l" style={{ borderColor: "var(--border)" }}>
                {/* Hour rows */}
                {hours.map(h => (
                  <div key={h} onClick={() => {
                    const dt = new Date(d);
                    dt.setHours(h, 0, 0, 0);
                    onSlotClick(dt.toISOString());
                  }}
                    className="border-b cursor-pointer hover:brightness-110"
                    style={{ height: HOUR_HEIGHT, borderColor: "var(--border)", background: isToday ? "rgba(229,162,16,0.02)" : "transparent" }} />
                ))}

                {/* Current time line */}
                {isToday && showNow && (
                  <div ref={nowLineRef} className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowTop }}>
                    <div className="relative flex items-center">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#f87171", marginLeft: -4 }} />
                      <div className="flex-1 h-px" style={{ background: "#f87171" }} />
                    </div>
                  </div>
                )}

                {/* Events */}
                {dayEvs.map(e => {
                  const startH = toHourFraction(e.startAt, userTz);
                  const endH = e.endAt ? toHourFraction(e.endAt, userTz) : startH + 1;
                  const top = Math.max(0, (startH - DAY_START) * HOUR_HEIGHT);
                  const height = Math.max(20, (endH - startH) * HOUR_HEIGHT - 2);
                  const c = getColor(e.color);

                  return (
                    <div key={e.id} onClick={() => onEventClick(e)}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 cursor-pointer hover:brightness-125 overflow-hidden z-20"
                      style={{ top, height, background: c.bg, borderLeft: `2px solid ${c.border}` }}>
                      <div className="text-[10px] font-medium truncate" style={{ color: c.text }}>{e.title}</div>
                      {height > 30 && (
                        <div className="text-[9px]" style={{ color: c.text, opacity: 0.7 }}>
                          {fmtInTz(e.startAt, userTz, { hour: "2-digit", minute: "2-digit", hour12: false })}
                          {e.endAt && ` – ${fmtInTz(e.endAt, userTz, { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
