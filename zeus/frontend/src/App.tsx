import { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "./api";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Email from "./pages/Email";
import Notes from "./pages/Notes";
import Automations from "./pages/Automations";
import Modules from "./pages/Modules";
import Settings from "./pages/Settings";
import AgentDetail from "./pages/AgentDetail";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";

type AuthState = "loading" | "onboarding" | "login" | "authenticated";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profile, setProfile] = useState<any>({});
  const checkAuth = async () => {
    try {
      const status = await api.authStatus();
      setProfile(status);
      if (!status.onboarded) { setAuthState("onboarding"); return; }
      await api.dashboard();
      setAuthState("authenticated");
    } catch (e: any) { setAuthState(e.message === "not_onboarded" ? "onboarding" : "login"); }
  };
  useEffect(() => {
    checkAuth();
    const h = () => setAuthState("login");
    window.addEventListener("zeus:logout", h);
    return () => window.removeEventListener("zeus:logout", h);
  }, []);

  if (authState === "loading") return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}><div className="text-2xl font-semibold" style={{ color: "var(--accent)" }}>ZEUS</div></div>;
  if (authState === "onboarding") return <Onboarding onComplete={() => { checkAuth(); setAuthState("authenticated"); }} />;
  if (authState === "login") return <Login onLogin={() => checkAuth()} />;
  return <Shell onLogout={() => setAuthState("login")} profile={profile} />;
}

const IC = {
  home: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>,
  tasks: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
  cal: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>,
  email: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>,
  notes: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>,
  auto: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>,
  mods: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
  set: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
};

const NAV = [
  { to: "/", label: "Home", icon: IC.home, end: true },
  { to: "/tasks", label: "Tasks", icon: IC.tasks },
  { to: "/calendar", label: "Calendar", icon: IC.cal },
  { to: "/email", label: "Email", icon: IC.email },
  { to: "/notes", label: "Notes", icon: IC.notes },
  { to: "/automations", label: "Auto", icon: IC.auto },
  { to: "/modules", label: "Modules", icon: IC.mods },
  { to: "/settings", label: "Settings", icon: IC.set },
];

function Shell({ onLogout, profile }: { onLogout: () => void; profile: any }) {
  const userName = profile.user_name || "";
  const assistantName = profile.assistant_name || "Zeus";
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [showSupport, setShowSupport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Notifications
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const loadNotifCount = useCallback(() => { api.notifCount().then((r) => setNotifCount(r.count)).catch(() => {}); }, []);
  useEffect(() => { loadNotifCount(); const t = setInterval(loadNotifCount, 10000); return () => clearInterval(t); }, []);

  const openNotifs = async () => {
    const n = await api.getNotifications();
    setNotifs(n);
    setShowNotifs(!showNotifs);
  };

  const doSearch = async () => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const r = await api.search(searchQuery);
    setSearchResults(r.results || []);
    setShowSearch(true);
  };

  const navItem = (n: typeof NAV[0]) => (
    <NavLink key={n.to} to={n.to} end={n.end} className="flex flex-col items-center w-full" onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}>
      {({ isActive }) => (
        <div className={`relative flex flex-col items-center gap-0.5 w-full py-2 transition-all ${isActive ? "" : "opacity-40 hover:opacity-70"}`}>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r" style={{ background: "var(--accent)" }} />}
          <span style={{ color: isActive ? "var(--accent)" : "var(--text-secondary)" }}>{n.icon}</span>
          <span className="text-[9px]" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>{n.label}</span>
        </div>
      )}
    </NavLink>
  );

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-root)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-50 w-[60px] h-full flex flex-col items-center py-3 border-r shrink-0 transition-transform`} style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="mb-3 mt-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            {assistantName.charAt(0).toUpperCase()}
          </div>
        </div>
        <nav className="flex-1 flex flex-col items-center w-full gap-0.5 overflow-auto">{NAV.map(navItem)}</nav>
        <div className="mt-auto flex flex-col items-center gap-1 mb-2">
          <button onClick={() => setShowSupport(true)} title="Help" className="opacity-30 hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "var(--text-secondary)" }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
          </button>
          <button onClick={async () => { await api.logout(); onLogout(); }} title="Sign out" className="opacity-30 hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "var(--text-secondary)" }}><path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden md:ml-0" style={{ marginLeft: 0 }}>
        {/* Top bar */}
        <div className="shrink-0 border-b px-4 md:px-6 py-2 flex items-center gap-3" style={{ background: "var(--bg-root)", borderColor: "var(--border)" }}>
          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{ color: "var(--text-muted)" }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
          </button>

          <span className="text-sm hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
            {userName ? <>{getGreeting()}, <span style={{ color: "var(--text-primary)" }}>{userName}</span></> : getGreeting()}
          </span>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-auto relative">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              placeholder="Search..."
              className="w-full rounded-md border px-3 py-1.5 text-xs"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 rounded-lg border shadow-lg max-h-64 overflow-auto z-50" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {searchResults.map((r, i) => (
                  <div key={i} className="px-3 py-2 text-xs border-b cursor-pointer hover:brightness-110" style={{ borderColor: "var(--border)" }}
                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full mr-2" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{r.type}</span>
                    <span style={{ color: "var(--text-primary)" }}>{r.title}</span>
                  </div>
                ))}
                <div className="px-3 py-1.5 text-[10px] text-center cursor-pointer" style={{ color: "var(--text-muted)" }} onClick={() => setShowSearch(false)}>Close</div>
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button onClick={openNotifs} className="relative p-1" style={{ color: "var(--text-muted)" }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold" style={{ background: "var(--accent)", color: "#000" }}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border shadow-lg max-h-80 overflow-auto z-50" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Notifications</span>
                  <button onClick={async () => { await api.readAllNotifs(); loadNotifCount(); setShowNotifs(false); }} className="text-[10px]" style={{ color: "var(--accent)" }}>Mark all read</button>
                </div>
                {notifs.map((n) => (
                  <div key={n.id} className="px-3 py-2 border-b" style={{ borderColor: "var(--border)", background: n.read ? "transparent" : "var(--accent-bg)" }}
                    onClick={async () => { await api.readNotif(n.id); loadNotifCount(); const updated = notifs.map((x) => x.id === n.id ? { ...x, read: true } : x); setNotifs(updated); }}>
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                    {n.body && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>}
                    <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>{new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
                {notifs.length === 0 && <p className="p-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>No notifications</p>}
              </div>
            )}
          </div>

          <span className="text-xs hidden sm:inline" style={{ color: "var(--text-muted)" }}>{assistantName}</span>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-auto ${isHome ? "" : "p-4 md:p-6"}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/email" element={<Email />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/agents/:id" element={<AgentDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showSearch && <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />}
      {showNotifs && <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />}
    </div>
  );
}

function SupportModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"help" | "ticket">("help");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/support/ticket", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, description, category }) });
      setResult(await r.json());
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Help & Support</h3>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>Close</button>
        </div>
        <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
          {[{ key: "help", label: "Help" }, { key: "ticket", label: "Submit Ticket" }].map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key as any); setResult(null); }} className="px-3 py-2 text-xs font-medium relative" style={{ color: tab === t.key ? "var(--accent)" : "var(--text-muted)" }}>
              {t.label}{tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />}
            </button>
          ))}
        </div>
        {tab === "help" && (
          <div className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              <p className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>Quick start</p>
              <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <li><strong>Home</strong> — Chat with your assistant. Attach files with 📎</li>
                <li><strong>Tasks</strong> — Your to-do list. Click the circle to mark done</li>
                <li><strong>Calendar</strong> — Week view. Add events manually or ask your assistant</li>
                <li><strong>Notes</strong> — Pin important info. "Save a note: gate code is 4521"</li>
                <li><strong>Automations</strong> — Recurring workflows. "Summarize emails every morning"</li>
                <li><strong>Modules</strong> — Install add-ons (Finance, Travel, School, Health)</li>
              </ul>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              <p className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>Try saying...</p>
              <ul className="space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <li>"Add a task: buy groceries by Friday, high priority"</li>
                <li>"Remind me to call the doctor tomorrow at 3pm"</li>
                <li>"Check my email"</li>
                <li>"Add a meeting with John on Thursday at 2pm"</li>
                <li>"Save a note: wifi password is abc123"</li>
                <li>"What's on my plate today?"</li>
              </ul>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              <p className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>Setup guides</p>
              <ul className="space-y-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <li><strong>Telegram bot</strong> — Chat from your phone. Open Telegram, message @BotFather, send /newbot, choose a name, copy the token. Paste it in Settings, click Start Bot. Then go to any Agent's Telegram tab, generate a pairing code, and send /pair CODE to your bot.</li>
                <li><strong>Email</strong> — Read and send emails. Go to Settings, scroll to Email. Enter IMAP and SMTP details. Gmail: use an App Password from myaccount.google.com/apppasswords.</li>
                <li><strong>Modules</strong> — Go to Modules in the sidebar. Click Install. Fill in settings if prompted.</li>
              </ul>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Your data stays on your server. Nothing is shared externally except API calls to OpenAI and your email provider.
            </p>
          </div>
        )}
        {tab === "ticket" && (
          <div className="space-y-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
              <option>General</option><option>Bug report</option><option>Feature request</option><option>Configuration help</option><option>Storage issue</option>
            </select>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-md border px-3 py-2 text-sm" style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue..." className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]" style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            {result && <div className="rounded-md p-3 text-xs" style={{ background: result.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: result.success ? "#4ade80" : "#f87171" }}>{result.message || result.error}</div>}
            <button onClick={submitTicket} disabled={sending || !subject.trim() || !description.trim()} className="w-full py-2.5 rounded-md text-sm font-medium disabled:opacity-30" style={{ background: "var(--accent)", color: "#000" }}>{sending ? "..." : "Submit Ticket"}</button>
            <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>Sent to support.zeus@zephyre.com</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }
