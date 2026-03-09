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
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
