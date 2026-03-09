import { useEffect, useState } from "react";
import { api } from "../api";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [level, setLevel] = useState("");

  const load = () => {
    const params: Record<string, string> = { limit: "200" };
    if (level) params.level = level;
    api.getLogs(params).then(setLogs);
  };
  useEffect(() => { load(); }, [level]);

  const clear = async () => {
    if (!confirm("Clear all logs?")) return;
    await api.clearLogs();
    load();
  };

  const levelColors: Record<string, string> = {
    info: "bg-blue-900/50 text-blue-400",
    warn: "bg-amber-900/50 text-amber-400",
    error: "bg-red-900/50 text-red-400",
    debug: "bg-gray-700/50 text-gray-400",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Logs</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm">
            Refresh
          </button>
          <button onClick={clear} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-sm">
            Clear
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["", "info", "warn", "error", "debug"].map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded text-xs ${
              level === l ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {l || "All"}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs">
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Level</th>
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[log.level] || ""}`}>
                    {log.level}
                  </span>
                </td>
                <td className="p-3 text-gray-400 text-xs">{log.source}</td>
                <td className="p-3 text-gray-300">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-4 text-gray-600 text-sm text-center">No logs found.</p>
        )}
      </div>
    </div>
  );
}
