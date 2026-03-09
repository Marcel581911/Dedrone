import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { api } from "./api";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Tickets from "./pages/Tickets";
import Skills from "./pages/Skills";
import SkillGaps from "./pages/SkillGaps";
import Automations from "./pages/Automations";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";

const NAV = [
  { to: "/", label: "Home", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
  )},
  { to: "/agents", label: "Agents", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
  )},
  { to: "/tickets", label: "Tickets", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
  )},
  { to: "/automations", label: "Auto", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>
  )},
  { to: "/skills", label: "Skills", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
  )},
  { to: "/skill-gaps", label: "Gaps", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
  )},
  { to: "/logs", label: "Logs", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
  )},
  { to: "/settings", label: "Settings", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
  )},
];

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
      <div className="text-center">
        <div className="text-2xl font-semibold mb-2" style={{ color: "var(--accent)" }}>ZEUS</div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    </div>
  );
}

function Shell({ onLogout, profile }: { onLogout: () => void; profile: any }) {
  const userName = profile.user_name || "";
  const assistantName = profile.assistant_name || "Zeus";

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-root)" }}>
      {/* Narrow icon sidebar */}
      <aside className="w-[60px] flex flex-col items-center py-3 border-r" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        {/* Logo */}
        <div className="mb-4 mt-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            Z
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 w-full">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className="group flex flex-col items-center w-full"
            >
              {({ isActive }) => (
                <div className={`relative flex flex-col items-center gap-0.5 w-full py-2 transition-colors ${isActive ? "" : "opacity-50 hover:opacity-80"}`}>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r" style={{ background: "var(--accent)" }} />}
                  <span style={{ color: isActive ? "var(--accent)" : "var(--text-secondary)" }}>{n.icon}</span>
                  <span className="text-[9px] leading-tight" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>{n.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / logout */}
        <div className="mt-auto mb-2 flex flex-col items-center gap-2">
          <button onClick={async () => { await api.logout(); onLogout(); }} title="Sign out"
            className="opacity-40 hover:opacity-80 transition-opacity">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "var(--text-secondary)" }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H6a1 1 0 110-2h5.586L8.293 1.707a1 1 0 011.414-1.414L14 4.586v2.828z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between" style={{ background: "var(--bg-root)", borderColor: "var(--border)" }}>
          <div>
            {userName && (
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {getGreeting()}, <span style={{ color: "var(--text-primary)" }}>{userName}</span>
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {assistantName}
          </div>
        </div>

        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/skill-gaps" element={<SkillGaps />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
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
