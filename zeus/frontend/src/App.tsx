import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { api } from "./api";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
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
    } catch (e: any) {
      setAuthState(e.message === "not_onboarded" ? "onboarding" : "login");
    }
  };

  useEffect(() => {
    checkAuth();
    const h = () => setAuthState("login");
    window.addEventListener("zeus:logout", h);
    return () => window.removeEventListener("zeus:logout", h);
  }, []);

  if (authState === "loading") return <Splash />;
  if (authState === "onboarding") return <Onboarding onComplete={() => { checkAuth(); setAuthState("authenticated"); }} />;
  if (authState === "login") return <Login onLogin={() => checkAuth()} />;
  return <Shell onLogout={() => setAuthState("login")} profile={profile} />;
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
      <div className="text-2xl font-semibold" style={{ color: "var(--accent)" }}>ZEUS</div>
    </div>
  );
}

const NAV = [
  { to: "/", label: "Home", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>, end: true },
  { to: "/tasks", label: "Tasks", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg> },
  { to: "/automations", label: "Auto", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg> },
  { to: "/modules", label: "Modules", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> },
  { to: "/settings", label: "Settings", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg> },
];

function Shell({ onLogout, profile }: { onLogout: () => void; profile: any }) {
  const userName = profile.user_name || "";
  const assistantName = profile.assistant_name || "Zeus";
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-root)" }}>
      {/* Sidebar */}
      <aside className="w-[60px] flex flex-col items-center py-3 border-r shrink-0" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="mb-4 mt-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            {assistantName.charAt(0).toUpperCase()}
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center w-full gap-0.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="flex flex-col items-center w-full">
              {({ isActive }) => (
                <div className={`relative flex flex-col items-center gap-0.5 w-full py-2.5 transition-all ${isActive ? "" : "opacity-40 hover:opacity-70"}`}>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r" style={{ background: "var(--accent)" }} />}
                  <span style={{ color: isActive ? "var(--accent)" : "var(--text-secondary)" }}>{n.icon}</span>
                  <span className="text-[9px]" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>{n.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={() => setShowSupport(true)} title="Help & Support"
          className="mb-1 opacity-30 hover:opacity-70 transition-opacity">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "var(--text-secondary)" }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
        </button>
        <button onClick={async () => { await api.logout(); onLogout(); }} title="Sign out"
          className="mb-2 opacity-30 hover:opacity-70 transition-opacity">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "var(--text-secondary)" }}>
            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b px-6 py-2.5 flex items-center justify-between" style={{ background: "var(--bg-root)", borderColor: "var(--border)" }}>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {userName ? <>{getGreeting()}, <span style={{ color: "var(--text-primary)" }}>{userName}</span></> : getGreeting()}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{assistantName}</span>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-auto ${isHome ? "" : "p-6"}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/agents/:id" element={<AgentDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {/* Support modal */}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
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
      const r = await fetch("/api/support/ticket", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, category }),
      });
      const data = await r.json();
      setResult(data);
      if (data.success) { setSubject(""); setDescription(""); }
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Help & Support</h3>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>Close</button>
        </div>

        <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
          {[{ key: "help", label: "Help" }, { key: "ticket", label: "Submit Ticket" }].map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key as any); setResult(null); }}
              className="px-3 py-2 text-xs font-medium relative"
              style={{ color: tab === t.key ? "var(--accent)" : "var(--text-muted)" }}>
              {t.label}
              {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />}
            </button>
          ))}
        </div>

        {tab === "help" && (
          <div className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Getting started</p>
              <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <li>Chat with your assistant on the <strong>Home</strong> page</li>
                <li>Attach files (PDF, Excel) — they're auto-summarized</li>
                <li>Set up recurring workflows in <strong>Automations</strong></li>
                <li>Install add-ons from <strong>Modules</strong></li>
                <li>Configure connections in <strong>Settings</strong></li>
              </ul>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Tips</p>
              <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <li>Your assistant remembers past conversations and files</li>
                <li>Ask it to create tasks, send emails, or manage your schedule</li>
                <li>It can create new agents when specialized help is needed</li>
                <li>All data stays on your VM — nothing is shared</li>
              </ul>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Need more help? Switch to the <strong>Submit Ticket</strong> tab.
            </p>
          </div>
        )}

        {tab === "ticket" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                <option>General</option>
                <option>Bug report</option>
                <option>Feature request</option>
                <option>Configuration help</option>
                <option>Storage issue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what you expected, and any steps to reproduce..."
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
                style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </div>

            {result && (
              <div className="rounded-md p-3 text-xs" style={{
                background: result.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: result.success ? "#4ade80" : "#f87171",
              }}>
                {result.message || result.error}
              </div>
            )}

            <button onClick={submitTicket} disabled={sending || !subject.trim() || !description.trim()}
              className="w-full py-2.5 rounded-md text-sm font-medium disabled:opacity-30"
              style={{ background: "var(--accent)", color: "#000" }}>
              {sending ? "Sending..." : "Submit Ticket"}
            </button>

            <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
              Tickets are sent to zeus.support@zephyre.com when email is configured.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
