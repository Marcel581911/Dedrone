import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <PageWrap><p className="text-red-400">{error}</p></PageWrap>;
  if (!data) return <PageWrap><p className="text-gray-500">Loading...</p></PageWrap>;

  const cards = [
    { label: "Agents", value: data.agents, color: "text-blue-400", to: "/agents" },
    { label: "Total Tickets", value: data.totalTickets, color: "text-green-400", to: "/tickets" },
    { label: "Skill Gaps", value: data.skillGaps, color: "text-amber-400", to: "/skill-gaps" },
    { label: "Skills", value: data.skills, color: "text-purple-400", to: "/skills" },
  ];

  return (
    <PageWrap>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
          >
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Ticket Status</h3>
          <div className="space-y-2">
            {Object.entries(data.tickets as Record<string, number>).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="capitalize">{status.replace("_", " ")}</span>
                <span className="text-gray-400">{count}</span>
              </div>
            ))}
            {Object.keys(data.tickets).length === 0 && (
              <p className="text-gray-600 text-sm">No tickets yet</p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {data.recentActivity.map((log: any) => (
              <div key={log.id} className="text-sm border-b border-gray-800 pb-2">
                <div className="flex justify-between">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${levelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300 mt-1">{log.message}</p>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="text-gray-600 text-sm">No activity yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-400">Runtime Status:</span>
          <span className="text-sm text-green-400 font-medium">{data.runtimeStatus}</span>
        </div>
      </div>
    </PageWrap>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return <div className="p-6 max-w-6xl mx-auto">{children}</div>;
}

function levelColor(level: string) {
  switch (level) {
    case "error": return "bg-red-900/50 text-red-400";
    case "warn": return "bg-amber-900/50 text-amber-400";
    case "debug": return "bg-gray-700/50 text-gray-400";
    default: return "bg-blue-900/50 text-blue-400";
  }
}
