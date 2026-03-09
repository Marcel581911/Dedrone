import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { Badge, Btn } from "../components/ui";

export default function Home() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("Zeus");
  const [convs, setConvs] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getAgents().then(async (agents) => {
      const orch = agents.find((a: any) => a.id === "orchestrator-001") || agents.find((a: any) => a.role === "Coordinator");
      if (orch) {
        setAgentId(orch.id);
        setAgentName(orch.name);
        const convs = await api.getConversations(orch.id);
        setConvs(convs);
        if (convs.length > 0) {
          selectConv(convs[0]);
        } else {
          // Auto-create first conversation so user can type immediately
          const c = await api.createConversation(orch.id);
          setConvs([c]);
          setActiveConv(c);
        }
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    });
    loadActivity();
    const timer = setInterval(loadActivity, 15000);
    return () => clearInterval(timer);
  }, []);

  const loadActivity = async () => {
    try {
      const [tickets, logs] = await Promise.all([
        api.getTickets({ limit: "8" } as any),
        api.getLogs({ limit: "5" }),
      ]);
      const items: any[] = [];
      tickets.forEach((t: any) => items.push({ type: "task", title: t.title, status: t.status, time: t.updatedAt, agent: t.agent?.name }));
      logs.forEach((l: any) => items.push({ type: "log", message: l.message, level: l.level, time: l.createdAt }));
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 10));
    } catch {}
  };

  const loadConversations = async (id: string) => {
    const c = await api.getConversations(id);
    setConvs(c);
    if (c.length > 0) selectConv(c[0]);
  };

  const selectConv = async (c: any) => { setActiveConv(c); setMessages(await api.getMessages(c.id)); };

  const newConv = async () => {
    if (!agentId) return;
    const c = await api.createConversation(agentId);
    setConvs([c, ...convs]);
    setActiveConv(c);
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || !activeConv || !agentId || sending) return;
    const msg = input; setInput("");
    setMessages((p) => [...p, { id: "t", role: "user", content: msg, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      await api.chat(agentId, activeConv.id, msg);
      setMessages(await api.getMessages(activeConv.id));
      setConvs(await api.getConversations(agentId));
      loadActivity();
    } catch (e: any) {
      setMessages((p) => [...p, { id: "e", role: "assistant", content: `Error: ${e.message}` }]);
    } finally { setSending(false); }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!agentId) return <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>Loading...</div>;

  const statusColor = (s: string) => {
    const m: Record<string, "green" | "amber" | "blue" | "red" | "gray"> = { done: "green", in_progress: "amber", queued: "blue", failed: "red" };
    return m[s] || "gray";
  };

  return (
    <div className="flex h-full">
      {/* Conversations */}
      <div className="w-48 border-r flex flex-col shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="p-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <button onClick={newConv} className="w-full text-xs py-2 rounded-md"
            style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            + New chat
          </button>
        </div>
        <div className="flex-1 overflow-auto p-1.5">
          {convs.map((c) => (
            <button key={c.id} onClick={() => selectConv(c)}
              className="w-full text-left px-2.5 py-2 rounded-md text-xs truncate mb-0.5"
              style={{ background: activeConv?.id === c.id ? "var(--accent-bg)" : "transparent", color: activeConv?.id === c.id ? "var(--accent)" : "var(--text-muted)" }}>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>What can I help you with?</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ask {agentName} anything — manage tasks, send emails, plan your day.</p>
            <Btn variant="primary" onClick={newConv}>Start a conversation</Btn>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-6 py-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Ask {agentName} anything</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {["Summarize my unread emails", "Create a task for tomorrow", "What's on my plate?"].map((s) => (
                        <button key={s} onClick={() => { setInput(s); }}
                          className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-[var(--accent)]"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      {m.role === "assistant" && <p className="text-[10px] mb-1 px-1" style={{ color: "var(--text-muted)" }}>{agentName}</p>}
                      <div className="rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
                        style={{
                          background: m.role === "user" ? "var(--accent-bg)" : "var(--bg-card)",
                          color: m.role === "user" ? "var(--accent)" : "var(--text-secondary)",
                          border: `1px solid ${m.role === "user" ? "rgba(229,162,16,0.15)" : "var(--border)"}`,
                        }}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-4 py-3 text-sm border" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <div className="shrink-0 border-t px-6 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="max-w-3xl mx-auto flex gap-2">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={`Message ${agentName}...`} disabled={sending}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <button onClick={send} disabled={sending || !input.trim()}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
                  style={{ background: "var(--accent)", color: "#000" }}>
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Activity feed */}
      <div className="w-56 border-l shrink-0 overflow-auto" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Activity</p>
        </div>
        <div className="p-2">
          {activity.map((a, i) => (
            <div key={i} className="px-2 py-2 border-b" style={{ borderColor: "var(--border)" }}>
              {a.type === "task" ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>
                    {a.agent && <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{a.agent}</span>}
                  </div>
                  <p className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{a.title}</p>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{a.message}</p>
                </div>
              )}
              <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>
                {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
          {activity.length === 0 && <p className="text-[11px] text-center py-4" style={{ color: "var(--text-muted)" }}>No recent activity</p>}
        </div>
      </div>
    </div>
  );
}
