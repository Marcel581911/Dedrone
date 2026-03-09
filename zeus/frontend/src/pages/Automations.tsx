import { useEffect, useState } from "react";
import { api } from "../api";

export default function Automations() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ what: "", systems: "", frequency: "", dataSource: "", delivery: "" });
  const [tab, setTab] = useState<"automations" | "scheduled">("automations");

  const load = () => {
    api.getAutomations().then(setAutomations);
    api.getScheduledTasks().then(setTasks);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.what.trim()) return;
    await api.createAutomation(form);
    setForm({ what: "", systems: "", frequency: "", dataSource: "", delivery: "" });
    setShowCreate(false);
    load();
  };

  const testAuto = async (id: string) => {
    const result = await api.testAutomation(id);
    if (!result.success) alert(`Test failed: ${result.error}`);
    load();
  };

  const confirmAuto = async (id: string) => {
    await api.confirmAutomation(id);
    load();
  };

  const removeAuto = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    await api.deleteAutomation(id);
    load();
  };

  const toggleTask = async (id: string, enabled: boolean) => {
    await api.updateScheduledTask(id, { enabled: !enabled });
    load();
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-700/50 text-gray-400",
    pending: "bg-blue-900/50 text-blue-400",
    processing: "bg-yellow-900/50 text-yellow-400",
    tested: "bg-purple-900/50 text-purple-400",
    active: "bg-green-900/50 text-green-400",
    failed: "bg-red-900/50 text-red-400",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Automations</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium">
          + New Automation
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("automations")}
          className={`px-4 py-2 rounded text-sm ${tab === "automations" ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>
          Automations ({automations.length})
        </button>
        <button onClick={() => setTab("scheduled")}
          className={`px-4 py-2 rounded text-sm ${tab === "scheduled" ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>
          Scheduled Tasks ({tasks.length})
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Create Automation</h3>
          <p className="text-xs text-gray-500 mb-4">
            Describe what you want automated. The Orchestrator will set it up and confirm when done.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">What should be done?</label>
              <input value={form.what} onChange={(e) => setForm({ ...form, what: e.target.value })}
                placeholder="e.g. Summarize my unread emails every morning"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Systems / Tools involved</label>
                <input value={form.systems} onChange={(e) => setForm({ ...form, systems: e.target.value })}
                  placeholder="e.g. Email, Slack, Database"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  placeholder="e.g. Every day at 8am, Every hour"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Where to get the data</label>
                <input value={form.dataSource} onChange={(e) => setForm({ ...form, dataSource: e.target.value })}
                  placeholder="e.g. IMAP inbox, API endpoint, file"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">How/where to deliver results</label>
                <input value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                  placeholder="e.g. Email me, Telegram, Dashboard"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">Create & Assign</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div className="space-y-3">
          {automations.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{a.what}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[a.status] || ""}`}>{a.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-400">
                    {a.systems && <div><span className="text-gray-600">Systems:</span> {a.systems}</div>}
                    {a.frequency && <div><span className="text-gray-600">Frequency:</span> {a.frequency}</div>}
                    {a.dataSource && <div><span className="text-gray-600">Data source:</span> {a.dataSource}</div>}
                    {a.delivery && <div><span className="text-gray-600">Delivery:</span> {a.delivery}</div>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {a.status !== "active" && (
                    <button onClick={() => testAuto(a.id)}
                      className="text-xs px-3 py-1 bg-purple-900/30 text-purple-400 rounded hover:bg-purple-900/50">Test</button>
                  )}
                  {(a.status === "tested" || a.status === "processing") && (
                    <button onClick={() => confirmAuto(a.id)}
                      className="text-xs px-3 py-1 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50">Confirm</button>
                  )}
                  <button onClick={() => removeAuto(a.id)}
                    className="text-xs text-gray-600 hover:text-red-400">Delete</button>
                </div>
              </div>
              {a.testResult && (
                <div className="mt-3 bg-gray-800 rounded p-3 text-sm text-gray-300">
                  <p className="text-xs text-gray-500 mb-1">Test result:</p>
                  <p className="whitespace-pre-wrap text-xs">{a.testResult.slice(0, 500)}</p>
                </div>
              )}
            </div>
          ))}
          {automations.length === 0 && <p className="text-gray-600 text-sm">No automations yet. Create one above.</p>}
        </div>
      )}

      {tab === "scheduled" && (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{t.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${t.enabled ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                      {t.enabled ? "Active" : "Paused"}
                    </span>
                    <span className="text-xs text-gray-600">every {t.intervalMin}min</span>
                  </div>
                  <p className="text-xs text-gray-500">{t.description}</p>
                  {t.lastRunAt && (
                    <p className="text-xs text-gray-600 mt-1">
                      Last run: {new Date(t.lastRunAt).toLocaleString()} — {t.lastResult.slice(0, 100)}
                    </p>
                  )}
                </div>
                <button onClick={() => toggleTask(t.id, t.enabled)}
                  className={`text-xs px-3 py-1 rounded ${t.enabled ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}>
                  {t.enabled ? "Pause" : "Resume"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
