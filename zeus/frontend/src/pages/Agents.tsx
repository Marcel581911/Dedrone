import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Agents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", mission: "", description: "" });

  const load = () => api.getAgents().then(setAgents);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await api.createAgent(form);
    setForm({ name: "", role: "", mission: "", description: "" });
    setShowCreate(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    await api.deleteAgent(id);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Agents</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium transition-colors"
        >
          + New Agent
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Create Agent</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Mission"
              value={form.mission}
              onChange={(e) => setForm({ ...form, mission: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm col-span-2"
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {agents.map((a) => (
          <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between">
              <Link to={`/agents/${a.id}`} className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${a.enabled ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                    {a.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{a.role} — {a.mission}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">{a.model}</span>
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                    {a.agentSkills?.length || 0} skills
                  </span>
                </div>
              </Link>
              <button
                onClick={() => remove(a.id)}
                className="text-gray-600 hover:text-red-400 text-sm ml-4"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {agents.length === 0 && <p className="text-gray-600">No agents yet. Create one above.</p>}
      </div>
    </div>
  );
}
