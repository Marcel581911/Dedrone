import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Card, Btn, Badge, Input, Label } from "../components/ui";

// ── Constants ─────────────────────────────────────────────────────────────────
const TICKET_TYPES = ["support", "bug", "feature", "question"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const STATUSES = ["open", "in_progress", "review", "resolved", "closed"] as const;

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", review: "In Review",
  resolved: "Resolved", closed: "Closed",
};

const TYPE_COLORS: Record<string, string> = {
  bug: "#f87171", feature: "#818cf8", support: "#60a5fa", question: "#34d399",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#9ca3af", medium: "#f59e0b", high: "#f97316", critical: "#ef4444",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "●", medium: "●●", high: "●●●", critical: "●●●●",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#60a5fa", in_progress: "#f59e0b", review: "#818cf8",
  resolved: "#34d399", closed: "#6b7280",
};

const COL_ORDER: typeof STATUSES[number][] = ["open", "in_progress", "review", "resolved", "closed"];

function typeLabel(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Ticket Detail Panel ────────────────────────────────────────────────────────
function TicketPanel({ ticket: initial, isAdmin, currentUserId, onUpdate, onClose }: {
  ticket: any; isAdmin: boolean; currentUserId: string; onUpdate: (t: any) => void; onClose: () => void;
}) {
  const [ticket, setTicket] = useState(initial);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: initial.title, description: initial.description });
  const [adminEdit, setAdminEdit] = useState({ status: initial.status, priority: initial.priority, assignedTo: initial.assignedTo || "", type: initial.type, resolution: initial.resolution || "" });
  const [users, setUsers] = useState<any[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdmin) api.getUsers().then(setUsers).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    // Load full ticket with comments
    api.getSupportTicket(ticket.id).then(t => { setTicket(t); setAdminEdit({ status: t.status, priority: t.priority, assignedTo: t.assignedTo || "", type: t.type, resolution: t.resolution || "" }); }).catch(() => {});
  }, [ticket.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.comments]);

  const saveEdit = async () => {
    const updated = await api.updateSupportTicket(ticket.id, editData);
    setTicket({ ...ticket, ...updated }); setEditing(false); onUpdate({ ...ticket, ...updated });
  };

  const saveAdminEdit = async () => {
    const data: any = { ...adminEdit };
    if (data.assignedTo === "") data.assignedTo = null;
    const updated = await api.updateSupportTicket(ticket.id, data);
    const full = await api.getSupportTicket(ticket.id);
    setTicket(full); onUpdate(full);
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const c = await api.addSupportComment(ticket.id, comment);
      setTicket({ ...ticket, comments: [...(ticket.comments || []), c] });
      setComment("");
    } catch (e: any) { alert(e.message); }
    finally { setPosting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-full max-w-xl h-full flex flex-col border-l shadow-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: TYPE_COLORS[ticket.type] + "20", color: TYPE_COLORS[ticket.type] }}>{typeLabel(ticket.type)}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: STATUS_COLORS[ticket.status] + "20", color: STATUS_COLORS[ticket.status] }}>{STATUS_LABEL[ticket.status]}</span>
              <span className="text-[10px]" style={{ color: PRIORITY_COLORS[ticket.priority] }}>{PRIORITY_DOT[ticket.priority]} {typeLabel(ticket.priority)}</span>
            </div>
            <h2 className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{ticket.title}</h2>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              by {ticket.user?.name || "Unknown"} · {timeAgo(ticket.createdAt)}
              {ticket.assignee && ` · assigned to ${ticket.assignee.name}`}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 text-lg leading-none mt-0.5" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--text-muted)" }}>Description</span>
              {(isAdmin || ticket.userId === currentUserId) && ticket.status === "open" && !editing && (
                <button className="text-[10px] underline" style={{ color: "var(--accent)" }} onClick={() => { setEditing(true); setEditData({ title: ticket.title, description: ticket.description }); }}>Edit</button>
              )}
            </div>
            {editing ? (
              <div className="space-y-2">
                <Input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
                <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} rows={4} className="w-full rounded px-2 py-1.5 text-xs resize-none" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                <div className="flex gap-2"><Btn variant="primary" onClick={saveEdit} style={{ padding: "3px 10px", fontSize: 11 }}>Save</Btn><Btn onClick={() => setEditing(false)} style={{ padding: "3px 10px", fontSize: 11 }}>Cancel</Btn></div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{ticket.description || <span style={{ color: "var(--text-muted)" }}>No description.</span>}</p>
            )}
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="rounded-lg p-3 space-y-3" style={{ background: "var(--bg-input)" }}>
              <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--text-muted)" }}>Admin Controls</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Status</Label>
                  <select value={adminEdit.status} onChange={e => setAdminEdit({ ...adminEdit, status: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <select value={adminEdit.priority} onChange={e => setAdminEdit({ ...adminEdit, priority: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{typeLabel(p)}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Type</Label>
                  <select value={adminEdit.type} onChange={e => setAdminEdit({ ...adminEdit, type: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                    {TICKET_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Assignee</Label>
                  <select value={adminEdit.assignedTo} onChange={e => setAdminEdit({ ...adminEdit, assignedTo: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                    <option value="">Unassigned</option>
                    {users.filter(u => u.role === "admin").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {adminEdit.status === "resolved" && (
                  <div className="col-span-2">
                    <Label>Resolution note</Label>
                    <textarea value={adminEdit.resolution} onChange={e => setAdminEdit({ ...adminEdit, resolution: e.target.value })} rows={2} className="w-full rounded px-2 py-1.5 text-xs resize-none" style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                  </div>
                )}
              </div>
              <Btn variant="primary" onClick={saveAdminEdit} style={{ padding: "3px 12px", fontSize: 11 }}>Apply changes</Btn>
            </div>
          )}

          {/* Resolution note (non-admin view) */}
          {!isAdmin && ticket.resolution && (
            <div className="rounded-lg p-3" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)" }}>
              <p className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: "#34d399" }}>Resolution</p>
              <p className="text-xs" style={{ color: "var(--text-primary)" }}>{ticket.resolution}</p>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              Comments ({ticket.comments?.length || 0})
            </p>
            <div className="space-y-2">
              {(ticket.comments || []).map((c: any) => (
                <div key={c.id} className="rounded-lg p-3" style={{ background: c.isAdmin ? "var(--accent-bg)" : "var(--bg-input)", border: c.isAdmin ? "1px solid var(--accent)" : "none" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-medium" style={{ color: c.isAdmin ? "var(--accent)" : "var(--text-primary)" }}>
                      {c.user?.name || "Unknown"}{c.isAdmin && " (Admin)"}
                    </span>
                    <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{c.content}</p>
                </div>
              ))}
              {(ticket.comments || []).length === 0 && (
                <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>No comments yet.</p>
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>
        </div>

        {/* Comment input */}
        {ticket.status !== "closed" && (
          <div className="shrink-0 p-4 border-t" style={{ borderColor: "var(--border)" }}>
            <textarea value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment(); }}
              placeholder="Add a comment… (Cmd+Enter to send)" rows={2}
              className="w-full rounded px-2 py-1.5 text-xs resize-none mb-2"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
            <Btn variant="primary" onClick={postComment} disabled={posting || !comment.trim()} style={{ padding: "4px 14px", fontSize: 11 }}>
              {posting ? "..." : "Send"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Card ───────────────────────────────────────────────────────────────
function KanbanCard({ ticket, onClick, onDragStart }: { ticket: any; onClick: () => void; onDragStart: (e: React.DragEvent) => void }) {
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      className="rounded-lg p-3 cursor-pointer hover:brightness-110 transition-all select-none"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: TYPE_COLORS[ticket.type] + "20", color: TYPE_COLORS[ticket.type] }}>{typeLabel(ticket.type)}</span>
        <span className="text-[9px]" style={{ color: PRIORITY_COLORS[ticket.priority] }} title={typeLabel(ticket.priority)}>{PRIORITY_DOT[ticket.priority]}</span>
      </div>
      <p className="text-xs font-medium leading-snug mb-1.5" style={{ color: "var(--text-primary)" }}>{ticket.title}</p>
      <div className="flex items-center justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
        <span>{ticket.user?.name || "Unknown"}</span>
        <div className="flex items-center gap-2">
          {ticket._count?.comments > 0 && <span>💬 {ticket._count.comments}</span>}
          <span>{timeAgo(ticket.updatedAt)}</span>
        </div>
      </div>
      {ticket.assignee && (
        <p className="text-[9px] mt-1" style={{ color: "var(--accent)" }}>→ {ticket.assignee.name}</p>
      )}
    </div>
  );
}

// ── Admin Kanban Board ────────────────────────────────────────────────────────
function KanbanBoard({ tickets, setTickets, onSelectTicket }: { tickets: any[]; setTickets: (t: any[]) => void; onSelectTicket: (t: any) => void }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = tickets.filter(t =>
    (!typeFilter || t.type === typeFilter) &&
    (!priorityFilter || t.priority === priorityFilter) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.user?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const byStatus = (status: string) => filtered.filter(t => t.status === status);

  const handleDrop = async (status: string) => {
    if (!dragging || dragging === status) return;
    const ticket = tickets.find(t => t.id === dragging);
    if (!ticket || ticket.status === status) return;

    // Optimistic update
    setTickets(tickets.map(t => t.id === dragging ? { ...t, status } : t));
    await api.updateSupportTicket(dragging, { status }).catch(() => {
      // Revert on error
      setTickets(tickets);
    });
    setDragging(null); setOverCol(null);
  };

  const totalOpen = tickets.filter(t => t.status !== "resolved" && t.status !== "closed").length;

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180, padding: "4px 10px", fontSize: 11 }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
          <option value="">All types</option>
          {TICKET_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{typeLabel(p)}</option>)}
        </select>
        {totalOpen > 0 && (
          <span className="ml-auto text-xs self-center" style={{ color: "var(--text-muted)" }}>{totalOpen} open</span>
        )}
      </div>

      {/* Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {COL_ORDER.map(status => {
          const cards = byStatus(status);
          const isOver = overCol === status;
          return (
            <div key={status} className="shrink-0 flex flex-col" style={{ width: 220 }}
              onDragOver={e => { e.preventDefault(); setOverCol(status); }}
              onDragLeave={() => setOverCol(null)}
              onDrop={() => handleDrop(status)}>
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{STATUS_LABEL[status]}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{cards.length}</span>
              </div>
              {/* Drop zone */}
              <div className="flex-1 rounded-lg p-2 space-y-2 transition-all" style={{ background: isOver ? "var(--accent-bg)" : "var(--bg-surface)", border: `2px dashed ${isOver ? "var(--accent)" : "transparent"}`, minHeight: 100 }}>
                {cards.map(ticket => (
                  <KanbanCard key={ticket.id} ticket={ticket}
                    onClick={() => onSelectTicket(ticket)}
                    onDragStart={e => { e.dataTransfer.setData("text/plain", ticket.id); setDragging(ticket.id); }} />
                ))}
                {cards.length === 0 && (
                  <p className="text-[10px] text-center py-4" style={{ color: "var(--text-muted)" }}>Drop here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── User: My Tickets ──────────────────────────────────────────────────────────
function MyTickets({ tickets, onSelectTicket }: { tickets: any[]; onSelectTicket: (t: any) => void }) {
  return (
    <div className="space-y-2 mt-2">
      {tickets.length === 0 && (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>You haven't submitted any tickets yet.</p>
      )}
      {tickets.map(t => (
        <div key={t.id} onClick={() => onSelectTicket(t)} className="cursor-pointer hover:brightness-110 transition-all">
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: TYPE_COLORS[t.type] + "20", color: TYPE_COLORS[t.type] }}>{typeLabel(t.type)}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: STATUS_COLORS[t.status] + "20", color: STATUS_COLORS[t.status] }}>{STATUS_LABEL[t.status]}</span>
                  <span className="text-[9px]" style={{ color: PRIORITY_COLORS[t.priority] }}>{PRIORITY_DOT[t.priority]} {typeLabel(t.priority)}</span>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                {t.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{t.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{timeAgo(t.updatedAt)}</p>
                {t._count?.comments > 0 && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>💬 {t._count.comments}</p>}
                {t.assignee && <p className="text-[10px] mt-0.5" style={{ color: "var(--accent)" }}>{t.assignee.name}</p>}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

// ── Submit Form ───────────────────────────────────────────────────────────────
function SubmitForm({ onCreated }: { onCreated: (t: any) => void }) {
  const [form, setForm] = useState({ title: "", description: "", type: "support" as string, priority: "medium" as string });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const t = await api.createSupportTicket(form);
      setDone(true);
      onCreated(t);
      setTimeout(() => { setDone(false); setForm({ title: "", description: "", type: "support", priority: "medium" }); }, 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <Card className="text-center py-6">
      <p className="text-2xl mb-2">✓</p>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Ticket submitted!</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>We'll get back to you soon. You can track it in "My Tickets".</p>
    </Card>
  );

  return (
    <Card>
      <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>Submit a ticket</h3>
      <div className="space-y-3 max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              {TICKET_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <Label>Priority</Label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{typeLabel(p)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Short description of the issue or request" />
        </div>
        <div>
          <Label>Details</Label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Provide as much detail as possible — steps to reproduce, expected behavior, use case..."
            rows={4} className="w-full rounded px-2 py-1.5 text-xs resize-none"
            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
        </div>
        <Btn variant="primary" onClick={submit} disabled={submitting || !form.title.trim()} style={{ padding: "6px 20px" }}>
          {submitting ? "Submitting..." : "Submit Ticket"}
        </Btn>
      </div>
    </Card>
  );
}

// ── Main Support Page ─────────────────────────────────────────────────────────
interface Props { profile?: any; }

export default function Support({ profile }: Props) {
  const isAdmin = profile?.role === "admin";
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<"board" | "submit" | "mine">(isAdmin ? "board" : "submit");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getSupportTickets().then(setTickets).catch(() => {}).finally(() => setLoading(false));
    if (isAdmin) api.getSupportStats().then(setStats).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = (updated: any) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const handleCreated = (t: any) => {
    setTickets(prev => [t, ...prev]);
    if (isAdmin) setTab("board");
  };

  const tabs = isAdmin
    ? [{ id: "board", label: "Board" }, { id: "submit", label: "New Ticket" }] as const
    : [{ id: "submit", label: "Submit Ticket" }, { id: "mine", label: `My Tickets (${tickets.length})` }] as const;

  return (
    <div>
      {/* Header with stats for admin */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {STATUSES.map(s => {
            const count = stats.byStatus?.find((x: any) => x.status === s)?._count?.id || 0;
            return (
              <Card key={s} style={{ padding: "10px 14px" }}>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>{STATUS_LABEL[s]}</p>
                <p className="text-xl font-semibold" style={{ color: STATUS_COLORS[s] }}>{count}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-0.5 mb-5 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="px-3 py-2 text-xs font-medium relative"
            style={{ color: tab === t.id ? "var(--accent)" : "var(--text-muted)" }}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />}
          </button>
        ))}
      </div>

      {loading && tab === "board" && (
        <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</p>
      )}

      {tab === "board" && !loading && (
        <KanbanBoard tickets={tickets} setTickets={setTickets} onSelectTicket={setSelected} />
      )}
      {tab === "submit" && (
        <SubmitForm onCreated={handleCreated} />
      )}
      {tab === "mine" && (
        <MyTickets tickets={tickets} onSelectTicket={setSelected} />
      )}

      {selected && (
        <TicketPanel
          ticket={selected}
          isAdmin={isAdmin}
          currentUserId={profile?.id || ""}
          onUpdate={handleUpdate}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
