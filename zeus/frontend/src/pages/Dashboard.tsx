import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => { api.dashboard().then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;
  if (!data) return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;

  const stats = [
    { label: "Agents", value: data.agents, to: "/agents" },
    { label: "Tickets", value: data.totalTickets, to: "/tickets" },
    { label: "Skill Gaps", value: data.skillGaps, to: "/skill-gaps" },
    { label: "Skills", value: data.skills, to: "/skills" },
  ];

  return (
    <div className="max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="hover:border-[var(--border-hover)] transition-colors">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Ticket breakdown */}
        <Card>
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Ticket Status</h3>
          <div className="space-y-2">
            {Object.entries(data.tickets as Record<string, number>).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>{status.replace("_", " ")}</span>
                <span style={{ color: "var(--text-primary)" }}>{count}</span>
              </div>
            ))}
            {Object.keys(data.tickets).length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tickets yet</p>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Recent Activity</h3>
          <div className="space-y-2.5 max-h-56 overflow-auto">
            {data.recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-start gap-2">
                <Badge color={log.level === "error" ? "red" : log.level === "warn" ? "amber" : "blue"}>
                  {log.level}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{log.message}</p>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity</p>
            )}
          </div>
        </Card>
      </div>

      {/* Runtime status */}
      <div className="mt-4 flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Runtime active</span>
      </div>
    </div>
  );
}
