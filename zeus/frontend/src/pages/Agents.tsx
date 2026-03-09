import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { Card, PageTitle, Btn, Badge, Input, EmptyState } from "../components/ui";

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
    try { await api.deleteAgent(id); load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <PageTitle>Agents</PageTitle>
        <Btn variant="primary" onClick={() => setShowCreate(!showCreate)}>+ New Agent</Btn>
      </div>

      {showCreate && (
        <Card className="mb-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input placeholder="Mission" value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} className="col-span-2" />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2" />
          </div>
          <div className="flex gap-2">
            <Btn variant="primary" onClick={create}>Create</Btn>
            <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {agents.map((a) => (
          <Link key={a.id} to={`/agents/${a.id}`}>
            <div className="rounded-lg border p-4 transition-colors hover:border-[var(--border-hover)]"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                    <Badge color={a.enabled ? "green" : "red"}>{a.enabled ? "Active" : "Off"}</Badge>
                    {a.isSystem && <Badge color="purple">System</Badge>}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {a.role}{a.mission ? ` — ${a.mission}` : ""}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{a.model}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{a.agentSkills?.length || 0} skills</span>
                  </div>
                </div>
                {!a.isSystem && (
                  <button onClick={(e) => { e.preventDefault(); remove(a.id); }}
                    className="text-xs opacity-30 hover:opacity-100 transition-opacity" style={{ color: "#f87171" }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </Link>
        ))}
        {agents.length === 0 && <EmptyState>No agents yet.</EmptyState>}
      </div>
    </div>
  );
}
