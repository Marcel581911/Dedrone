import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Badge, Input, Select, TextArea, EmptyState, Label } from "../components/ui";

const PRI_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const PRI_COLOR: Record<string, string> = { critical: "var(--accent)", high: "#f87171", medium: "var(--text-secondary)", low: "var(--text-muted)" };

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("active");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", dueAt: "" });

  const load = () => {
    const p: Record<string, string> = {};
    if (filter === "active") { /* fetch all, filter client-side */ }
    else if (filter !== "all") p.status = filter;
    api.getTickets(p).then((t) => {
      let filtered = t;
      if (filter === "active") filtered = t.filter((x: any) => x.status !== "done");
      // Sort by priority then due date
      filtered.sort((a: any, b: any) => {
        const pa = PRI_ORDER[a.priority] ?? 2;
        const pb = PRI_ORDER[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTasks(filtered);
    });
  };
  useEffect(() => { load(); }, [filter]);

  const create = async () => {
    if (!form.title.trim()) return;
    await api.createTicket({ ...form, dueAt: form.dueAt || null });
    setForm({ title: "", description: "", priority: "medium", dueAt: "" });
    setShowAdd(false);
    load();
  };

  const markDone = async (id: string) => {
    await api.updateTicket(id, { status: "done" });
    load();
  };

  const reopen = async (id: string) => {
    await api.updateTicket(id, { status: "queued" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await api.deleteTicket(id);
    load();
  };

  const isOverdue = (t: any) => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== "done";
  const now = new Date();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <PageTitle>Tasks</PageTitle>
        <Btn variant="primary" onClick={() => setShowAdd(!showAdd)}>+ Add task</Btn>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4">
        {[["active", "Active"], ["all", "All"], ["done", "Done"], ["failed", "Failed"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className="px-3 py-1 rounded-md text-xs transition-colors"
            style={{ background: filter === k ? "var(--accent-bg)" : "var(--bg-input)", color: filter === k ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${filter === k ? "var(--accent)" : "var(--border)"}` }}>
            {label}
          </button>
        ))}
      </div>

      {/* Quick add */}
      {showAdd && (
        <Card className="mb-4">
          <div className="space-y-3">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus
              onKeyDown={(e) => e.key === "Enter" && !form.description && create()} />
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details (optional)" style={{ minHeight: 50 }} />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full">
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </Select>
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <Btn variant="primary" onClick={create}>Add</Btn>
                <Btn onClick={() => setShowAdd(false)}>Cancel</Btn>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Task list */}
      <div className="space-y-1.5">
        {tasks.map((t) => (
          <div key={t.id} className="group flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-[var(--border-hover)]"
            style={{ background: "var(--bg-card)", borderColor: isOverdue(t) ? "rgba(239,68,68,0.3)" : "var(--border)" }}>
            {/* Checkbox */}
            <button onClick={() => t.status === "done" ? reopen(t.id) : markDone(t.id)}
              className="mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
              style={{ borderColor: t.status === "done" ? "#4ade80" : "var(--border)", background: t.status === "done" ? "#4ade80" : "transparent" }}>
              {t.status === "done" && <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${t.status === "done" ? "line-through" : ""}`}
                  style={{ color: t.status === "done" ? "var(--text-muted)" : "var(--text-primary)" }}>
                  {t.title}
                </span>
                {t.status !== "done" && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRI_COLOR[t.priority] }} title={t.priority} />
                )}
                {t.status === "in_progress" && <Badge color="amber">working</Badge>}
              </div>
              {t.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t.description}</p>}
              <div className="flex gap-3 mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                {t.dueAt && (
                  <span style={{ color: isOverdue(t) ? "#f87171" : "var(--text-muted)" }}>
                    {isOverdue(t) ? "Overdue: " : "Due: "}
                    {new Date(t.dueAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    {!new Date(t.dueAt).toTimeString().startsWith("00:00") && ` ${new Date(t.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                )}
                {t.agent?.name && <span>{t.agent.name}</span>}
              </div>
              {t.output && t.status === "done" && (
                <p className="text-xs mt-1 rounded p-2" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                  {t.output.slice(0, 150)}{t.output.length > 150 ? "..." : ""}
                </p>
              )}
            </div>

            {/* Actions */}
            <button onClick={() => remove(t.id)} className="text-[10px] opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" style={{ color: "#f87171" }}>
              Delete
            </button>
          </div>
        ))}
        {tasks.length === 0 && <EmptyState>{filter === "active" ? "No active tasks. You're all caught up!" : "No tasks found."}</EmptyState>}
      </div>
    </div>
  );
}
