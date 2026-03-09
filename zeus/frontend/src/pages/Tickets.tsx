import { useEffect, useState } from "react";
import { api } from "../api";

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", agentId: "",
  });

  const load = () => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    api.getTickets(params).then(setTickets);
  };
  useEffect(() => { load(); api.getAgents().then(setAgents); }, []);
  useEffect(() => { load(); }, [filter]);

  const create = async () => {
    if (!form.title.trim()) return;
    await api.createTicket({
      ...form,
      agentId: form.agentId || null,
    });
    setForm({ title: "", description: "", priority: "medium", agentId: "" });
    setShowCreate(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete ticket?")) return;
    await api.deleteTicket(id);
    load();
  };

  const [processing, setProcessing] = useState(false);
  const processNext = async () => {
    setProcessing(true);
    try {
      const result = await api.processTicket();
      if (!result.processed) {
        alert("No queued tickets to process.");
      }
      load();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const statusColors: Record<string, string> = {
    queued: "bg-blue-900/50 text-blue-400",
    in_progress: "bg-yellow-900/50 text-yellow-400",
    done: "bg-green-900/50 text-green-400",
    failed: "bg-red-900/50 text-red-400",
    blocked: "bg-gray-700/50 text-gray-400",
  };

  const priorityColors: Record<string, string> = {
    low: "text-gray-400",
    medium: "text-blue-400",
    high: "text-amber-400",
    critical: "text-red-400",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tickets</h2>
        <div className="flex gap-2">
          <button
            onClick={processNext}
            disabled={processing}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium disabled:opacity-50"
          >
            {processing ? "Processing..." : "Process Next"}
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium"
          >
            + New Ticket
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["", "queued", "in_progress", "done", "failed", "blocked"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs ${
              filter === s ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Create Ticket</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm col-span-2"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm col-span-2 min-h-[80px]"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={form.agentId}
              onChange={(e) => setForm({ ...form, agentId: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{t.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[t.status]}`}>{t.status}</span>
                  <span className={`text-xs ${priorityColors[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-sm text-gray-400">{t.description}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-600">
                  <span>Agent: {t.agent?.name || "Unassigned"}</span>
                  <span>{new Date(t.createdAt).toLocaleString()}</span>
                </div>
                {t.output && (
                  <div className="mt-3 bg-gray-800 rounded p-3 text-sm text-gray-300">
                    <p className="text-xs text-gray-500 mb-1">Output:</p>
                    <p className="whitespace-pre-wrap">{t.output}</p>
                  </div>
                )}
              </div>
              <button onClick={() => remove(t.id)} className="text-gray-600 hover:text-red-400 text-sm ml-4">Delete</button>
            </div>
          </div>
        ))}
        {tickets.length === 0 && <p className="text-gray-600 text-sm">No tickets found.</p>}
      </div>
    </div>
  );
}
