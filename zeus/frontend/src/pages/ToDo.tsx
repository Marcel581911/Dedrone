import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { Btn, Input, Select, TextArea, EmptyState, Label } from "../components/ui";

const PRI_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const PRI_COLOR: Record<string, string> = {
  critical: "var(--accent)", high: "#f87171",
  medium: "var(--text-secondary)", low: "var(--text-muted)",
};
const PRI_BG: Record<string, string> = {
  critical: "rgba(229,162,16,0.15)", high: "rgba(248,113,113,0.12)",
  medium: "rgba(255,255,255,0.05)", low: "transparent",
};
const CATEGORIES = ["All", "Work", "Personal", "School", "Travel", "Health", "Finance"];
const CAT_COLORS: Record<string, string> = {
  Work: "#60a5fa", Personal: "#a78bfa", School: "#34d399",
  Travel: "#fbbf24", Health: "#f87171", Finance: "#2dd4bf",
};
const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "due", label: "Due date" },
  { value: "created", label: "Created" },
  { value: "alpha", label: "A–Z" },
];

type SortKey = "priority" | "due" | "created" | "alpha";

function formatDue(dueAt: string, done: boolean): { text: string; urgent: boolean; overdue: boolean } {
  const d = new Date(dueAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const overdue = !done && d < now;
  const urgent = !done && !overdue && diffDays <= 1;

  let text = "";
  if (overdue) {
    const daysLate = Math.floor((now.getTime() - d.getTime()) / 86400000);
    text = daysLate === 0 ? "Due today (overdue)" : `Overdue ${daysLate}d`;
  } else if (diffDays === 0) {
    text = `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    text = `Tomorrow`;
  } else if (diffDays < 7) {
    text = d.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
  } else {
    const sameYear = d.getFullYear() === now.getFullYear();
    text = d.toLocaleDateString([], { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
  }

  return { text, urgent, overdue };
}

function sortTasks(tasks: any[], sort: SortKey): any[] {
  return [...tasks].sort((a, b) => {
    if (sort === "priority") {
      const pa = PRI_ORDER[a.priority] ?? 2, pb = PRI_ORDER[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "due") {
      if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "alpha") return a.title.localeCompare(b.title);
    return 0;
  });
}

const BLANK_FORM = { title: "", description: "", priority: "medium", category: "Personal", dueAt: "", recurring: "" };

export default function ToDo() {
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [catFilter, setCatFilter] = useState("All");
  const [sort, setSort] = useState<SortKey>("priority");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = () => api.getTickets({}).then(setAllTasks).catch(() => {});
  useEffect(() => { load(); }, []);

  // Keyboard shortcut: N to add, / to search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" || e.key === "N") { setShowAdd(true); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const create = async () => {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setSaving(true); setFormError("");
    try {
      await api.createTicket({ ...form, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null });
      setForm({ ...BLANK_FORM, category: form.category });
      setShowAdd(false);
      load();
    } catch (e: any) {
      setFormError(e.message || "Failed to create task.");
    } finally { setSaving(false); }
  };

  const markDone = async (id: string) => { await api.updateTicket(id, { status: "done" }); load(); };
  const reopen = async (id: string) => { await api.updateTicket(id, { status: "queued" }); load(); };
  const remove = async (id: string) => { if (confirm("Delete this task?")) { await api.deleteTicket(id); load(); } };

  const startEdit = (t: any) => {
    setEditId(t.id);
    setEditForm({
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      category: t.category,
      dueAt: t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 16) : "",
      recurring: t.recurring || "",
    });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    setEditSaving(true);
    try {
      await api.updateTicket(editId!, {
        ...editForm,
        dueAt: editForm.dueAt ? new Date(editForm.dueAt).toISOString() : null,
      });
      setEditId(null);
      load();
    } finally { setEditSaving(false); }
  };

  const isOverdue = (t: any) => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== "done";
  const isDueToday = (t: any) => {
    if (!t.dueAt || t.status === "done") return false;
    const d = new Date(t.dueAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  // Derived counts (always from allTasks)
  const activeTasks = allTasks.filter((t) => t.status !== "done");
  const doneTasks = allTasks.filter((t) => t.status === "done");
  const todayTasks = allTasks.filter((t) => (isDueToday(t) || isOverdue(t)) && t.status !== "done");

  const catCount = (cat: string) => {
    const src = activeTasks;
    return cat === "All" ? src.length : src.filter((t) => t.category === cat).length;
  };

  // Apply filters
  let visible = allTasks;
  if (statusFilter === "active") visible = activeTasks;
  else if (statusFilter === "done") visible = doneTasks;
  else if (statusFilter === "today") visible = todayTasks;
  // else "all"

  if (catFilter !== "All") visible = visible.filter((t) => t.category === catFilter);

  if (search.trim()) {
    const q = search.toLowerCase();
    visible = visible.filter((t) =>
      t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }

  visible = sortTasks(visible, sort);

  const statusCounts = {
    active: activeTasks.length,
    today: todayTasks.length,
    all: allTasks.length,
    done: doneTasks.length,
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>To Do</h2>
          {activeTasks.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              {activeTasks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search… (/)"
            style={{ width: 160, fontSize: 12, padding: "5px 10px" }}
          />
          <Btn variant="primary" onClick={() => { setShowAdd(!showAdd); setFormError(""); }}>+ Add</Btn>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const count = catCount(cat);
          const isActive = catFilter === cat;
          return (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
              style={{
                background: isActive ? (cat === "All" ? "var(--accent-bg)" : `${CAT_COLORS[cat]}18`) : "var(--bg-input)",
                color: isActive ? (cat === "All" ? "var(--accent)" : CAT_COLORS[cat]) : "var(--text-muted)",
                border: `1px solid ${isActive ? (cat === "All" ? "var(--accent)" : CAT_COLORS[cat] + "50") : "var(--border)"}`,
              }}>
              {cat !== "All" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[cat] }} />}
              {cat}
              {count > 0 && <span className="text-[10px] opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Status + sort row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-0.5">
          {([["active", "Active"], ["today", "Today"], ["all", "All"], ["done", "Done"]] as [string, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className="relative px-2.5 py-1 rounded-md text-[10px] flex items-center gap-1"
              style={{
                background: statusFilter === k ? "var(--accent-bg)" : "transparent",
                color: statusFilter === k ? "var(--accent)" : "var(--text-muted)",
              }}>
              {label}
              {statusCounts[k as keyof typeof statusCounts] > 0 && (
                <span className="text-[9px] opacity-60">{statusCounts[k as keyof typeof statusCounts]}</span>
              )}
              {k === "today" && todayTasks.length > 0 && statusFilter !== "today" && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#f87171" }} />
              )}
            </button>
          ))}
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ fontSize: 11, padding: "3px 6px", width: "auto" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border mb-4 p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="space-y-3">
            <Input value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setFormError(""); }}
              placeholder="What needs to be done?" autoFocus
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && create()} />
            <TextArea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notes (optional)" style={{ minHeight: 48 }} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">
                  {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
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
              <div>
                <Label>Repeat</Label>
                <Select value={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.value })} className="w-full">
                  <option value="">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </div>
            </div>
            {formError && <p className="text-xs" style={{ color: "#f87171" }}>{formError}</p>}
            <div className="flex gap-2">
              <Btn variant="primary" onClick={create} disabled={saving}>{saving ? "Saving…" : "Add task"}</Btn>
              <Btn onClick={() => { setShowAdd(false); setFormError(""); }}>Cancel</Btn>
              <span className="text-[10px] self-center" style={{ color: "var(--text-muted)" }}>Enter to save</span>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-1">
        {visible.map((t) => {
          const overdue = isOverdue(t);
          const isEditing = editId === t.id;
          const due = t.dueAt ? formatDue(t.dueAt, t.status === "done") : null;

          return (
            <div key={t.id}
              className="group rounded-lg border transition-colors"
              style={{
                background: overdue ? PRI_BG.high : t.priority === "critical" ? PRI_BG.critical : "var(--bg-card)",
                borderColor: overdue ? "rgba(248,113,113,0.35)" : isEditing ? "var(--accent)" : "var(--border)",
              }}>
              {/* Main row */}
              <div className="flex items-start gap-3 px-4 py-3">
                {/* Checkbox */}
                <button
                  onClick={() => t.status === "done" ? reopen(t.id) : markDone(t.id)}
                  className="mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderColor: t.status === "done" ? "#4ade80" : overdue ? "#f87171" : PRI_COLOR[t.priority] || "var(--border)",
                    background: t.status === "done" ? "#4ade80" : "transparent",
                  }}>
                  {t.status === "done" && (
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-medium ${t.status === "done" ? "line-through" : ""}`}
                      style={{ color: t.status === "done" ? "var(--text-muted)" : "var(--text-primary)" }}>
                      {t.title}
                    </span>

                    {/* Priority dot */}
                    {t.status !== "done" && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRI_COLOR[t.priority] }} title={t.priority} />
                    )}

                    {/* Category pill */}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: `${CAT_COLORS[t.category] || "#888"}18`, color: CAT_COLORS[t.category] || "var(--text-muted)" }}>
                      {t.category}
                    </span>

                    {/* Recurring badge */}
                    {t.recurring && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}>
                        ↻ {t.recurring}
                      </span>
                    )}

                    {t.status === "in_progress" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>working</span>
                    )}
                  </div>

                  {t.description && !isEditing && (
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{t.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {due && (
                      <span style={{ color: due.overdue ? "#f87171" : due.urgent ? "#fbbf24" : "var(--text-muted)" }}>
                        {due.overdue ? "⚠ " : due.urgent ? "⏰ " : ""}{due.text}
                      </span>
                    )}
                    {t.agent?.name && <span>→ {t.agent.name}</span>}
                    {t.status === "done" && t.completedAt && (
                      <span>Done {new Date(t.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    )}
                  </div>

                  {/* Agent output (done tasks) */}
                  {t.output && t.status === "done" && (
                    <p className="text-xs mt-1.5 rounded p-2 leading-relaxed"
                      style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                      {t.output.slice(0, 200)}{t.output.length > 200 ? "…" : ""}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => isEditing ? setEditId(null) : startEdit(t)}
                    className="text-[10px] px-2 py-1 rounded"
                    style={{ color: isEditing ? "var(--accent)" : "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                  <button onClick={() => remove(t.id)} className="text-[10px] px-2 py-1 rounded"
                    style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>Del</button>
                </div>
              </div>

              {/* Inline edit panel */}
              {isEditing && (
                <div className="px-4 pb-4 pt-0 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="pt-3">
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Title" autoFocus />
                  </div>
                  <TextArea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Notes (optional)" style={{ minHeight: 44 }} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label>Category</Label>
                      <Select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full">
                        {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="w-full">
                        <option value="low">Low</option><option value="medium">Medium</option>
                        <option value="high">High</option><option value="critical">Critical</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Due date</Label>
                      <Input type="datetime-local" value={editForm.dueAt} onChange={(e) => setEditForm({ ...editForm, dueAt: e.target.value })} />
                    </div>
                    <div>
                      <Label>Repeat</Label>
                      <Select value={editForm.recurring} onChange={(e) => setEditForm({ ...editForm, recurring: e.target.value })} className="w-full">
                        <option value="">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Btn variant="primary" onClick={saveEdit} disabled={editSaving}>{editSaving ? "Saving…" : "Save changes"}</Btn>
                    <Btn onClick={() => setEditId(null)}>Cancel</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <EmptyState>
            {search
              ? `No tasks match "${search}"`
              : statusFilter === "active" ? "All caught up! Press N to add a task."
              : statusFilter === "today" ? "Nothing due today."
              : "No tasks found."}
          </EmptyState>
        )}
      </div>

      {/* Footer hint */}
      {allTasks.length > 0 && (
        <p className="text-[10px] mt-6 text-center" style={{ color: "var(--text-muted)" }}>
          N — add task · / — search · click task to edit
        </p>
      )}
    </div>
  );
}
