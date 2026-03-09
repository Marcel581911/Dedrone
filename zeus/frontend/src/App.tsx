import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Tickets from "./pages/Tickets";
import Skills from "./pages/Skills";
import SkillGaps from "./pages/SkillGaps";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";

const NAV = [
  { to: "/", label: "Dashboard", icon: "◆" },
  { to: "/agents", label: "Agents", icon: "●" },
  { to: "/tickets", label: "Tickets", icon: "▬" },
  { to: "/skills", label: "Skills", icon: "⚙" },
  { to: "/skill-gaps", label: "Skill Gaps", icon: "△" },
  { to: "/logs", label: "Logs", icon: "▤" },
  { to: "/settings", label: "Settings", icon: "☰" },
];

export default function App() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider text-amber-400">⚡ ZEUS</h1>
          <p className="text-xs text-gray-500 mt-1">Agent Runtime v1.0</p>
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
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
          Local Runtime • SQLite
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/tickets" element={<Tickets />} />
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
