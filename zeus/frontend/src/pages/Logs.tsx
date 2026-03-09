import { useEffect, useState } from "react";
import { api } from "../api";
import { PageTitle, Btn, Badge } from "../components/ui";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [level, setLevel] = useState("");

  const load = () => {
    const p: Record<string, string> = { limit: "200" };
    if (level) p.level = level;
    api.getLogs(p).then(setLogs);
  };
  useEffect(() => { load(); }, [level]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <PageTitle>Logs</PageTitle>
        <div className="flex gap-2">
          <Btn onClick={load}>Refresh</Btn>
          <Btn variant="danger" onClick={() => { if (confirm("Clear all?")) { api.clearLogs(); load(); } }}>Clear</Btn>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {["", "info", "warn", "error"].map((l) => (
          <button key={l} onClick={() => setLevel(l)}
            className="px-3 py-1 rounded-md text-xs transition-colors"
            style={{ background: level === l ? "var(--accent-bg)" : "var(--bg-input)", color: level === l ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${level === l ? "var(--accent)" : "var(--border)"}` }}>
            {l || "All"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Time</th>
              <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Level</th>
              <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Source</th>
              <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="hover:brightness-110" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {new Date(l.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-3 py-2">
                  <Badge color={l.level === "error" ? "red" : l.level === "warn" ? "amber" : "blue"}>{l.level}</Badge>
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{l.source}</td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{l.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>No logs.</p>}
      </div>
    </div>
  );
}
