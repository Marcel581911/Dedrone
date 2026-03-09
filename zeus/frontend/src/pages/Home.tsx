import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { Btn } from "../components/ui";

export default function Home() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("Zeus");
  const [convs, setConvs] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAgents().then((agents) => {
      const orch = agents.find((a: any) => a.id === "orchestrator-001") || agents.find((a: any) => a.role === "Coordinator");
      if (orch) {
        setAgentId(orch.id);
        setAgentName(orch.name);
        loadConversations(orch.id);
      }
    });
  }, []);

  const loadConversations = async (id: string) => {
    const c = await api.getConversations(id);
    setConvs(c);
    if (c.length > 0) selectConv(c[0]);
  };

  const selectConv = async (c: any) => {
    setActiveConv(c);
    setMessages(await api.getMessages(c.id));
  };

  const newConv = async () => {
    if (!agentId) return;
    const c = await api.createConversation(agentId);
    setConvs([c, ...convs]);
    setActiveConv(c);
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || !activeConv || !agentId || sending) return;
    const msg = input;
    setInput("");
    setMessages((p) => [...p, { id: "t", role: "user", content: msg, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      await api.chat(agentId, activeConv.id, msg);
      setMessages(await api.getMessages(activeConv.id));
      setConvs(await api.getConversations(agentId));
    } catch (e: any) {
      setMessages((p) => [...p, { id: "e", role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!agentId) return <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <div className="w-52 border-r flex flex-col shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
          <button onClick={newConv} className="w-full text-xs py-2 rounded-md transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            + New conversation
          </button>
        </div>
        <div className="flex-1 overflow-auto p-1.5">
          {convs.map((c) => (
            <button key={c.id} onClick={() => selectConv(c)}
              className="w-full text-left px-3 py-2 rounded-md text-xs truncate mb-0.5 transition-colors"
              style={{ background: activeConv?.id === c.id ? "var(--accent-bg)" : "transparent", color: activeConv?.id === c.id ? "var(--accent)" : "var(--text-muted)" }}>
              {c.title}
            </button>
          ))}
          {convs.length === 0 && (
            <p className="text-[10px] text-center py-4" style={{ color: "var(--text-muted)" }}>No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start a conversation with {agentName}</p>
            <Btn variant="primary" onClick={newConv}>New conversation</Btn>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-6 py-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ask {agentName} anything...</p>
                </div>
              )}
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      {m.role === "assistant" && (
                        <p className="text-[10px] mb-1 px-1" style={{ color: "var(--text-muted)" }}>{agentName}</p>
                      )}
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
                      <span className="inline-block animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t px-6 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="max-w-3xl mx-auto flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={`Message ${agentName}...`} disabled={sending}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <button onClick={send} disabled={sending || !input.trim()}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30 transition-opacity"
                  style={{ background: "var(--accent)", color: "#000" }}>
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
