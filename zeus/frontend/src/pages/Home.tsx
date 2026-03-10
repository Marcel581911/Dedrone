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
  const [showActivity, setShowActivity] = useState(true);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getAgents().then(async (agents) => {
      const orch = agents.find((a: any) => a.id === "orchestrator-001") || agents.find((a: any) => a.role === "Coordinator");
      if (orch) {
        setAgentId(orch.id);
        setAgentName(orch.name);
        const c = await api.getConversations(orch.id);
        setConvs(c);
        if (c.length > 0) { selectConv(c[0]); }
        else { const nc = await api.createConversation(orch.id); setConvs([nc]); setActiveConv(nc); }
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    });
    loadActivity();
    const timer = setInterval(loadActivity, 15000);
    return () => clearInterval(timer);
  }, []);

  const loadActivity = async () => {
    try {
      const [tickets, logs] = await Promise.all([api.getTickets({ limit: "8" } as any), api.getLogs({ limit: "5" })]);
      const items: any[] = [];
      tickets.forEach((t: any) => items.push({ type: "task", title: t.title, status: t.status, time: t.updatedAt, agent: t.agent?.name }));
      logs.forEach((l: any) => items.push({ type: "log", message: l.message, level: l.level, time: l.createdAt }));
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 10));
    } catch {}
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agentId || !activeConv) return;
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum is 5MB.");
      return;
    }

    setUploading(true);
    setMessages((p) => [...p, { id: "upload", role: "user", content: `📎 Uploading ${file.name}...`, createdAt: new Date().toISOString() }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/files/upload", { method: "POST", body: formData, credentials: "include" });
      const result = await res.json();

      if (!res.ok) {
        setMessages((p) => [...p, { id: "ue", role: "assistant", content: result.error || "Upload failed" }]);
        setUploading(false);
        return;
      }

      // Send the file content to the agent for summarization + memory indexing
      const prompt = [
        `I just uploaded a file: **${file.name}** (${(file.size / 1024).toFixed(1)}KB)`,
        ``,
        `File is saved to workspace as: ${result.storedName}`,
        ``,
        `Here is the extracted content:`,
        `---`,
        result.textContent.slice(0, 8000),
        `---`,
        ``,
        `Please:`,
        `1. Summarize the key information from this file`,
        `2. Note any important data points, dates, or action items`,
        `3. Remember this information for future reference`,
      ].join("\n");

      // Remove the "uploading" placeholder
      setMessages((p) => p.filter((m) => m.id !== "upload"));

      // Show the file as a user message
      setMessages((p) => [...p, { id: "f" + result.id, role: "user", content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)}KB)`, createdAt: new Date().toISOString() }]);
      setSending(true);

      await api.chat(agentId, activeConv.id, prompt);

      // Save summary to agent memory
      const msgs = await api.getMessages(activeConv.id);
      const lastAssistant = msgs.filter((m: any) => m.role === "assistant").pop();
      if (lastAssistant) {
        await api.addMemory(agentId, {
          type: "file",
          content: `File: ${file.name}\nStored as: ${result.storedName}\n\nSummary:\n${lastAssistant.content.slice(0, 2000)}`,
        });
      }

      setMessages(msgs);
      setConvs(await api.getConversations(agentId));
      loadActivity();
    } catch (e: any) {
      setMessages((p) => [...p, { id: "ue2", role: "assistant", content: `Upload error: ${e.message}` }]);
    } finally {
      setUploading(false);
      setSending(false);
    }
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
                        <button key={s} onClick={() => setInput(s)}
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
                {(sending || uploading) && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-4 py-3 text-sm border" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      <span className="animate-pulse">{uploading ? "Processing file..." : "Thinking..."}</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t px-6 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="max-w-3xl mx-auto flex gap-2">
                <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden"
                  accept=".pdf,.xlsx,.xls,.csv,.txt,.md,.json,.doc,.docx" />
                <button onClick={() => fileRef.current?.click()} disabled={sending || uploading}
                  title="Attach file (max 5MB)"
                  className="px-3 py-2.5 rounded-lg border transition-colors hover:border-[var(--accent)] disabled:opacity-30"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                  </svg>
                </button>
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={`Message ${agentName}...`} disabled={sending || uploading}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <button onClick={send} disabled={sending || uploading || !input.trim()}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
                  style={{ background: "var(--accent)", color: "#000" }}>
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Activity panel — collapsible */}
      <div className="shrink-0 flex" style={{ background: "var(--bg-surface)" }}>
        {/* Toggle button */}
        <button onClick={() => setShowActivity(!showActivity)}
          className="w-6 flex items-center justify-center border-l hover:brightness-125 transition-all"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          title={showActivity ? "Hide activity" : "Show activity"}>
          <svg viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${showActivity ? "" : "rotate-180"}`}>
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Panel content */}
        {showActivity && (
          <div className="w-52 border-l overflow-auto" style={{ borderColor: "var(--border)" }}>
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
                    <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{a.message}</p>
                  )}
                  <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
              {activity.length === 0 && <p className="text-[11px] text-center py-4" style={{ color: "var(--text-muted)" }}>No recent activity</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
