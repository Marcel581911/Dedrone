import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Badge, Input, Select, TextArea, EmptyState } from "../components/ui";

export default function Tasks() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", agentId: "" });
  const [processing, setProcessing] = useState(false);

  const load = () => {
    const p: Record<string, string> = {};
    if (filter) p.status = filter;
    api.getTickets(p).then(setTickets);
  };
  useEffect(() => { load(); api.getAgents().then(setAgents); }, []);
  useEffect(() => { load(); }, [filter]);

  const create = async () => {
    if (!form.title.trim()) return;
    await api.createTicket({ ...form, agentId: form.agentId || null });
    setForm({ title: "", description: "", priority: "medium", agentId: "" });
    setShowCreate(false);
    load();
  };

  const processNext = async () => {
    setProcessing(true);
    try {
      const r = await api.processTicket();
      if (!r.processed) alert("No queued tickets.");
      load();
    } finally { setProcessing(false); }
  };

  const statusColor = (s: string) => {
    const m: Record<string, "blue" | "amber" | "green" | "red" | "gray"> = { queued: "blue", in_progress: "amber", done: "green", failed: "red", blocked: "gray" };
    return m[s] || "gray";
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <PageTitle>Tasks</PageTitle>
        <div className="flex gap-2">
          <Btn onClick={processNext} disabled={processing}>{processing ? "..." : "Process Next"}</Btn>
          <Btn variant="primary" onClick={() => setShowCreate(!showCreate)}>+ New</Btn>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {["", "queued", "in_progress", "done", "failed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1 rounded-md text-xs transition-colors"
            style={{ background: filter === s ? "var(--accent-bg)" : "var(--bg-input)", color: filter === s ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}` }}>
            {s || "All"}
          </button>
        ))}
      </div>

      {showCreate && (
        <Card className="mb-5">
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextArea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 60 }} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </Select>
              <Select value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn variant="primary" onClick={create}>Create</Btn>
            <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {tickets.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</span>
                  <Badge color={statusColor(t.status)}>{t.status}</Badge>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t.priority}</span>
                </div>
                {t.description && <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t.description}</p>}
                <div className="flex gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span>{t.agent?.name || "Unassigned"}</span>
                  <span>{new Date(t.createdAt).toLocaleString()}</span>
                </div>
                {t.output && (
                  <div className="mt-2 rounded p-2.5 text-xs" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                    <p className="whitespace-pre-wrap">{t.output.slice(0, 400)}{t.output.length > 400 ? "..." : ""}</p>
                  </div>
                )}
              </div>
              <button onClick={() => { if (confirm("Delete?")) { api.deleteTicket(t.id); load(); } }}
                className="text-xs ml-3 opacity-30 hover:opacity-100" style={{ color: "#f87171" }}>Delete</button>
            </div>
          </Card>
        ))}
        {tickets.length === 0 && <EmptyState>No tickets found.</EmptyState>}
      </div>
    </div>
  );
}
