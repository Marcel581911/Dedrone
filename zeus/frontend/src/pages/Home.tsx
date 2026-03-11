import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { Btn } from "../components/ui";
import { Link } from "react-router-dom";

interface Props { profile?: any; }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function daysUntil(date: string | Date) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d} days`;
}

export default function Home({ profile }: Props) {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("Gulli");
  const [convs, setConvs] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dash, setDash] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.role === "admin") {
      api.checkUpdate().then((r) => setUpdateAvailable(!r.upToDate && !r.error)).catch(() => {});
    }
    api.getAgents().then(async (agents) => {
      const orch = agents.find((a: any) => profile?.id && a.userId === profile.id && a.role === "Coordinator")
        || agents.find((a: any) => a.role === "Coordinator")
        || agents.find((a: any) => a.id === "orchestrator-001");
      if (orch) {
        setAgentId(orch.id);
        setAgentName(orch.name);
        const c = await api.getConversations(orch.id);
        setConvs(c);
        if (c.length > 0) selectConv(c[0]);
        else { const nc = await api.createConversation(orch.id); setConvs([nc]); setActiveConv(nc); }
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    });
    loadDash();
    api.getWeather().then(setWeather).catch(() => {});
    const t = setInterval(loadDash, 30000);
    return () => clearInterval(t);
  }, []);

  const loadDash = () => api.dashboard().then(setDash).catch(() => {});
  const selectConv = async (c: any) => { setActiveConv(c); setMessages(await api.getMessages(c.id)); };
  const newConv = async () => { if (!agentId) return; const c = await api.createConversation(agentId); setConvs([c, ...convs]); setActiveConv(c); setMessages([]); };

  const send = async (msg?: string) => {
    const text = msg ?? input;
    if (!text.trim() || !activeConv || !agentId || sending) return;
    setInput("");
    setMessages((p) => [...p, { id: "t", role: "user", content: text, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      await api.chat(agentId, activeConv.id, text);
      setMessages(await api.getMessages(activeConv.id));
      setConvs(await api.getConversations(agentId));
      loadDash();
    } catch (e: any) { setMessages((p) => [...p, { id: "e", role: "assistant", content: `Error: ${e.message}` }]); }
    finally { setSending(false); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agentId || !activeConv) return;
    e.target.value = "";
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB."); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/files/upload", { method: "POST", body: fd, credentials: "include" });
      const result = await res.json();
      if (!res.ok) { setMessages((p) => [...p, { id: "ue", role: "assistant", content: result.error }]); return; }
      setMessages((p) => [...p, { id: "f", role: "user", content: `📎 ${file.name}`, createdAt: new Date().toISOString() }]);
      setSending(true);
      const prompt = `Uploaded file: **${file.name}**\n\nContent:\n---\n${result.textContent.slice(0, 8000)}\n---\n\nSummarize the key info and remember it.`;
      await api.chat(agentId, activeConv.id, prompt);
      const msgs = await api.getMessages(activeConv.id);
      const last = msgs.filter((m: any) => m.role === "assistant").pop();
      if (last) await api.addMemory(agentId, { type: "file", content: `File: ${file.name}\n${last.content.slice(0, 2000)}` });
      setMessages(msgs); setConvs(await api.getConversations(agentId));
    } catch (e: any) { setMessages((p) => [...p, { id: "ue2", role: "assistant", content: `Error: ${e.message}` }]); }
    finally { setUploading(false); setSending(false); }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Build contextual smart prompts based on current data
  const smartPrompts = (): string[] => {
    const prompts: string[] = [];
    if (dash?.overdueTasks?.length > 0) prompts.push(`I have ${dash.overdueTasks.length} overdue task${dash.overdueTasks.length > 1 ? "s" : ""} — help me prioritise`);
    if (dash?.upcomingTrip) prompts.push(`What do I need to prepare for my trip to ${dash.upcomingTrip.destination}?`);
    if (dash?.nextFlight) prompts.push(`Check the status of my flight ${dash.nextFlight.flightNumber || "soon"}`);
    if (dash?.pendingShoppingCount > 0) prompts.push(`What's on my shopping list?`);
    if (dash?.todayEvents?.length > 0) prompts.push(`Brief me on today`);
    // Always have a few fallbacks
    const fallbacks = [
      "What's my day looking like?",
      "How am I doing financially this month?",
      "Scan my emails for travel bookings",
      "Set a reminder for this week",
    ];
    const all = [...prompts, ...fallbacks];
    return all.slice(0, 4);
  };

  const priColor = (p: string) => ({ critical: "var(--accent)", high: "#f87171", medium: "var(--text-secondary)", low: "var(--text-muted)" }[p] || "var(--text-muted)");
  const flightStatusColor = (s: string) => ({ scheduled: "var(--text-muted)", delayed: "#fbbf24", cancelled: "#f87171", landed: "#4ade80" }[s] || "var(--text-muted)");

  if (!agentId) return <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Left: Conversations */}
      <div className="hidden md:flex w-48 border-r flex-col shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="p-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <button onClick={newConv} className="w-full text-xs py-2 rounded-md" style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>+ New chat</button>
        </div>
        <div className="flex-1 overflow-auto p-1.5">
          {convs.map((c) => (
            <button key={c.id} onClick={() => selectConv(c)} className="w-full text-left px-2.5 py-2 rounded-md text-xs truncate mb-0.5"
              style={{ background: activeConv?.id === c.id ? "var(--accent-bg)" : "transparent", color: activeConv?.id === c.id ? "var(--accent)" : "var(--text-muted)" }}>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Dashboard + Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Update banner — admin only */}
        {updateAvailable && (
          <div className="shrink-0 px-4 md:px-6 py-2 flex items-center justify-between border-b" style={{ borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
            <span className="text-xs" style={{ color: "var(--accent)" }}>A new version is available</span>
            <a href="/settings" className="text-xs font-medium underline" style={{ color: "var(--accent)" }}>Update now</a>
          </div>
        )}

        {/* Dashboard widgets */}
        {dash && (
          <div className="shrink-0 border-b px-4 md:px-6 py-3 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
            <div className="flex gap-3 min-w-max">

              {/* Tasks */}
              <Link to="/tools/todo" className="shrink-0 w-52 rounded-lg border p-3 hover:border-[var(--border-hover)] transition-colors" style={{ background: "var(--bg-card)", borderColor: dash.overdueTasks?.length > 0 ? "rgba(248,113,113,0.4)" : "var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Tasks</p>
                  {dash.overdueTasks?.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>{dash.overdueTasks.length} overdue</span>}
                </div>
                {dash.pendingTasks?.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priColor(t.priority) }} />
                    <span className="text-[11px] truncate" style={{ color: "var(--text-primary)" }}>{t.title}</span>
                  </div>
                ))}
                {(!dash.pendingTasks || dash.pendingTasks.length === 0) && <p className="text-[10px]" style={{ color: "#4ade80" }}>All clear ✓</p>}
              </Link>

              {/* Today's events */}
              <Link to="/tools/calendar" className="shrink-0 w-52 rounded-lg border p-3 hover:border-[var(--border-hover)] transition-colors" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                  Today · {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                </p>
                {dash.todayEvents?.slice(0, 3).map((e: any) => (
                  <div key={e.id} className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-[10px] shrink-0 tabular-nums" style={{ color: "var(--text-muted)" }}>{new Date(e.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-[11px] truncate" style={{ color: "var(--text-primary)" }}>{e.title}</span>
                  </div>
                ))}
                {(!dash.todayEvents || dash.todayEvents.length === 0) && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Nothing scheduled</p>}
              </Link>

              {/* Reminders */}
              {(dash.pendingReminders?.length > 0) && (
                <div className="shrink-0 w-44 rounded-lg border p-3" style={{ background: "var(--bg-card)", borderColor: "rgba(251,191,36,0.3)" }}>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Reminders today</p>
                  {dash.pendingReminders.slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-[10px] shrink-0" style={{ color: "#fbbf24" }}>⏰</span>
                      <span className="text-[11px] truncate" style={{ color: "var(--text-primary)" }}>{r.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Next trip */}
              {dash.upcomingTrip && (
                <Link to="/tools/travel" className="shrink-0 w-48 rounded-lg border p-3 hover:border-[var(--border-hover)] transition-colors" style={{ background: "var(--bg-card)", borderColor: "rgba(59,130,246,0.3)" }}>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Next trip ✈️</p>
                  <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {dash.upcomingTrip.coverEmoji} {dash.upcomingTrip.name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{dash.upcomingTrip.destination}</p>
                  <p className="text-[10px] mt-1 font-medium" style={{ color: "#3b82f6" }}>
                    {daysUntil(dash.upcomingTrip.startDate)}
                  </p>
                </Link>
              )}

              {/* Next flight status — if within 7 days */}
              {dash.nextFlight && (
                <Link to="/tools/travel" className="shrink-0 w-52 rounded-lg border p-3 hover:border-[var(--border-hover)] transition-colors" style={{ background: "var(--bg-card)", borderColor: dash.nextFlight.flightStatus === "delayed" ? "rgba(251,191,36,0.4)" : "rgba(59,130,246,0.2)" }}>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Flight</p>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {[dash.nextFlight.airline, dash.nextFlight.flightNumber].filter(Boolean).join(" ") || dash.nextFlight.title}
                  </p>
                  {dash.nextFlight.fromAirport && dash.nextFlight.toAirport && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{dash.nextFlight.fromAirport} → {dash.nextFlight.toAirport}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {new Date(dash.nextFlight.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ color: flightStatusColor(dash.nextFlight.flightStatus), background: "var(--bg-input)" }}>
                      {dash.nextFlight.flightStatus}
                    </span>
                  </div>
                  {dash.nextFlight.delayMinutes > 0 && (
                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: "#fbbf24" }}>+{dash.nextFlight.delayMinutes} min delay</p>
                  )}
                </Link>
              )}

              {/* Shopping */}
              {dash.pendingShoppingCount > 0 && (
                <Link to="/tools/shopping" className="shrink-0 w-36 rounded-lg border p-3 hover:border-[var(--border-hover)] transition-colors" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Shopping 🛒</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{dash.pendingShoppingCount}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>item{dash.pendingShoppingCount !== 1 ? "s" : ""} to buy</p>
                </Link>
              )}

              {/* Unread emails */}
              {dash.unreadEmailCount > 0 && (
                <Link to="/tools/email" className="shrink-0 w-36 rounded-lg border p-3 hover:border-[var(--border-hover)] transition-colors" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Inbox ✉️</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{dash.unreadEmailCount}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>unread</p>
                </Link>
              )}

              {/* Completed today */}
              {dash.recentDone?.length > 0 && (
                <div className="shrink-0 w-44 rounded-lg border p-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Done today</p>
                  {dash.recentDone.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-1 mb-1">
                      <span className="text-[10px]" style={{ color: "#4ade80" }}>✓</span>
                      <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Weather */}
              {weather?.current && (
                <div className="shrink-0 w-44 rounded-lg border p-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  {editingCity ? (
                    <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} autoFocus placeholder="City name..."
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && cityInput.trim()) { await api.updateMe({ city: cityInput.trim() }); setEditingCity(false); api.getWeather().then(setWeather); }
                        if (e.key === "Escape") setEditingCity(false);
                      }}
                      onBlur={() => setEditingCity(false)}
                      className="w-full rounded border px-1.5 py-0.5 text-[11px]"
                      style={{ background: "var(--bg-input)", borderColor: "var(--accent)", color: "var(--text-primary)" }} />
                  ) : (
                    <p className="text-[10px] font-medium mb-1 cursor-pointer hover:underline" style={{ color: "var(--text-muted)" }}
                      onClick={() => { setCityInput(weather.city || ""); setEditingCity(true); }} title="Click to change location">
                      📍 {weather.city}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{weather.current.temp}°</span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{weather.current.condition}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {weather.forecast?.slice(0, 2).map((d: any) => (
                      <div key={d.date} className="flex justify-between text-[10px]">
                        <span style={{ color: "var(--text-muted)" }}>{new Date(d.date).toLocaleDateString([], { weekday: "short" })}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{d.low}° / {d.high}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {weather && !weather?.current && (
                <div className="shrink-0 w-44 rounded-lg border p-3 cursor-pointer" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                  onClick={() => { setCityInput(""); setEditingCity(true); }}>
                  {editingCity
                    ? <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} autoFocus placeholder="Enter your city..."
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && cityInput.trim()) { await api.updateMe({ city: cityInput.trim() }); setEditingCity(false); api.getWeather().then(setWeather); }
                          if (e.key === "Escape") setEditingCity(false);
                        }}
                        onBlur={() => setEditingCity(false)}
                        className="w-full rounded border px-1.5 py-0.5 text-[11px]"
                        style={{ background: "var(--bg-input)", borderColor: "var(--accent)", color: "var(--text-primary)" }} />
                    : <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>📍 Set city for weather</p>
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
          {messages.length === 0 && activeConv && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  {greeting()}{profile?.name ? `, ${profile.name}` : ""}
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                  {agentName} is ready — what can I help you with?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {smartPrompts().map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-[var(--accent)] text-left"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.map((m, i) => (
              <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  {m.role === "assistant" && <p className="text-[10px] mb-0.5 px-1" style={{ color: "var(--text-muted)" }}>{agentName}</p>}
                  <div className="rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
                    style={{ background: m.role === "user" ? "var(--accent-bg)" : "var(--bg-card)", color: m.role === "user" ? "var(--accent)" : "var(--text-secondary)", border: `1px solid ${m.role === "user" ? "rgba(229,162,16,0.15)" : "var(--border)"}` }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {(sending || uploading) && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2.5 text-sm border" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <span className="animate-pulse">{uploading ? "Processing file…" : `${agentName} is thinking…`}</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input bar */}
        {activeConv && (
          <div className="shrink-0 border-t px-4 md:px-6 py-3" style={{ borderColor: "var(--border)" }}>
            <div className="max-w-3xl mx-auto">
              {/* Quick action chips */}
              {messages.length === 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                  {[
                    { label: "+ Task", msg: "Add a task: " },
                    { label: "🛒 Shopping", msg: "Add to my shopping list: " },
                    { label: "⏰ Reminder", msg: "Set a reminder for " },
                    { label: "📅 Event", msg: "Add a calendar event: " },
                    { label: "💰 Finance", msg: "How am I doing financially?" },
                    { label: "✈️ Travel", msg: "What's my next trip?" },
                  ].map(({ label, msg }) => (
                    <button key={label} onClick={() => { setInput(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-input)", whiteSpace: "nowrap" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept=".pdf,.xlsx,.xls,.csv,.txt,.md,.json" />
                <button onClick={() => fileRef.current?.click()} disabled={sending || uploading} title="Attach file"
                  className="px-2.5 py-2 rounded-lg border disabled:opacity-30 hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                </button>
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={`Message ${agentName}…`} disabled={sending || uploading}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <button onClick={() => send()} disabled={sending || uploading || !input.trim()}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
                  style={{ background: "var(--accent)", color: "#000" }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
