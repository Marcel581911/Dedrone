import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
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
  { to: "/", label: "Dashboard", icon: "◆" },
  { to: "/agents", label: "Agents", icon: "●" },
  { to: "/tickets", label: "Tickets", icon: "▬" },
  { to: "/automations", label: "Automations", icon: "↻" },
  { to: "/skills", label: "Skills", icon: "⚙" },
  { to: "/skill-gaps", label: "Skill Gaps", icon: "△" },
  { to: "/logs", label: "Logs", icon: "▤" },
  { to: "/settings", label: "Settings", icon: "☰" },
];

type AuthState = "loading" | "onboarding" | "login" | "authenticated";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profile, setProfile] = useState<any>({});

  const checkAuth = async () => {
    try {
      const status = await api.authStatus();
      setProfile(status);
      if (!status.onboarded) {
        setAuthState("onboarding");
        return;
      }
      await api.dashboard();
      setAuthState("authenticated");
    } catch (e: any) {
      if (e.message === "not_onboarded") {
        setAuthState("onboarding");
      } else {
        setAuthState("login");
      }
    }
  };

  useEffect(() => {
    checkAuth();
    const handleLogout = () => setAuthState("login");
    window.addEventListener("zeus:logout", handleLogout);
    return () => window.removeEventListener("zeus:logout", handleLogout);
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400 mb-3">⚡ ZEUS</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (authState === "onboarding") {
    return <Onboarding onComplete={() => { checkAuth(); setAuthState("authenticated"); }} />;
  }

  if (authState === "login") {
    return <Login onLogin={() => checkAuth()} />;
  }

  return <AuthenticatedApp onLogout={() => setAuthState("login")} profile={profile} />;
}

function AuthenticatedApp({ onLogout, profile }: { onLogout: () => void; profile: any }) {
  const userName = profile.user_name || "";
  const assistantName = profile.assistant_name || "Zeus";

  const logout = async () => {
    await api.logout();
    onLogout();
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider text-amber-400">⚡ {assistantName}</h1>
          {userName && (
            <p className="text-xs text-gray-500 mt-1">{userName}'s Assistant</p>
          )}
          {!userName && (
            <p className="text-xs text-gray-500 mt-1">Agent Runtime</p>
          )}
        </div>
        <nav className="flex-1 py-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-800 text-amber-400 border-r-2 border-amber-400"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`
              }
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
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
      </main>
    </div>
  );
}
