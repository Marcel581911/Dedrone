import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { Card, Btn, Badge, Input, TextArea, Label, Select, EmptyState } from "../components/ui";

type Tab = "config" | "chat" | "memory" | "tickets" | "skills" | "telegram";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("config");
  const [error, setError] = useState("");
  const load = () => { if (id) api.getAgent(id).then(setAgent).catch((e) => setError(e.message)); };
  useEffect(load, [id]);

  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;
  if (!agent) return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "config", label: "Config" }, { key: "chat", label: "Chat" }, { key: "memory", label: "Memory" },
    { key: "tickets", label: "Tickets" }, { key: "skills", label: "Skills" }, { key: "telegram", label: "Telegram" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/settings" className="text-xs" style={{ color: "var(--text-muted)" }}>← Settings</Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{agent.name}</span>
        <Badge color={agent.enabled ? "green" : "red"}>{agent.enabled ? "Active" : "Off"}</Badge>
      </div>

      <div className="flex gap-0.5 mb-5 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-2 text-xs font-medium transition-colors relative"
            style={{ color: tab === t.key ? "var(--accent)" : "var(--text-muted)" }}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />}
          </button>
        ))}
      </div>

      {tab === "config" && <ConfigTab agent={agent} onUpdate={load} />}
      {tab === "chat" && <ChatTab agent={agent} />}
      {tab === "memory" && <MemoryTab agent={agent} />}
      {tab === "tickets" && <TicketsTab agent={agent} />}
      {tab === "skills" && <SkillsTab agent={agent} onUpdate={load} />}
      {tab === "telegram" && <TelegramTab agent={agent} />}
    </div>
  );
}

function ConfigTab({ agent, onUpdate }: { agent: any; onUpdate: () => void }) {
  const [form, setForm] = useState({ ...agent, tags: JSON.parse(agent.tags || "[]").join(", ") });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.updateAgent(agent.id, { name: form.name, description: form.description, role: form.role, mission: form.mission, systemPrompt: form.systemPrompt, model: form.model, temperature: parseFloat(form.temperature), maxTokens: parseInt(form.maxTokens), enabled: form.enabled, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) });
      onUpdate();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 max-w-xl">
      <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
        <div><Label>Mission</Label><Input value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} /></div>
      </div>
      <div><Label>System Prompt</Label><TextArea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} style={{ minHeight: 120 }} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
        <div><Label>Temperature</Label><Input type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
        <div><Label>Max Tokens</Label><Input type="number" value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: e.target.value })} /></div>
      </div>
      <div><Label>Tags</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma-separated" /></div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Enabled</span>
      </div>
      <Btn variant="primary" onClick={save} disabled={saving}>{saving ? "..." : "Save"}</Btn>
    </div>
  );
}

function ChatTab({ agent }: { agent: any }) {
  const [convs, setConvs] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getConversations(agent.id).then((c) => { setConvs(c); if (c.length) selectConv(c[0]); });
  }, [agent.id]);

  const selectConv = async (c: any) => { setActiveConv(c); setMessages(await api.getMessages(c.id)); };
  const newConv = async () => { const c = await api.createConversation(agent.id); setConvs([c, ...convs]); setActiveConv(c); setMessages([]); };

  const send = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const msg = input; setInput("");
    setMessages((p) => [...p, { id: "t", role: "user", content: msg, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      await api.chat(agent.id, activeConv.id, msg);
      setMessages(await api.getMessages(activeConv.id));
      setConvs(await api.getConversations(agent.id));
    } catch (e: any) {
      setMessages((p) => [...p, { id: "e", role: "assistant", content: `Error: ${e.message}` }]);
    } finally { setSending(false); }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex gap-3" style={{ height: "calc(100vh - 200px)" }}>
      {/* Conversations list */}
      <div className="w-48 rounded-lg border overflow-auto" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
          <button onClick={newConv} className="w-full text-xs py-1.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>+ New</button>
        </div>
        <div className="p-1">
          {convs.map((c) => (
            <button key={c.id} onClick={() => selectConv(c)}
              className="w-full text-left px-2 py-1.5 rounded text-xs truncate"
              style={{ background: activeConv?.id === c.id ? "var(--accent-bg)" : "transparent", color: activeConv?.id === c.id ? "var(--accent)" : "var(--text-muted)" }}>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>Select or create a conversation</div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[75%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap"
                    style={{ background: m.role === "user" ? "var(--accent-bg)" : "var(--bg-input)", color: m.role === "user" ? "var(--accent)" : "var(--text-secondary)" }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && <div className="text-xs" style={{ color: "var(--text-muted)" }}>Thinking...</div>}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Message..." disabled={sending}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <Btn variant="primary" onClick={send} disabled={sending || !input.trim()}>Send</Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const FORMAT_GUIDE = [
  {
    id: "chatgpt",
    label: "ChatGPT export",
    ext: ".json",
    description: "Export your data from ChatGPT (Settings → Data Controls → Export). Upload the conversations.json file.",
    example: `[
  {
    "title": "Conversation title",
    "mapping": {
      "node-id": {
        "message": {
          "author": { "role": "user" },
          "content": { "parts": ["Hello, how are you?"] }
        }
      }
    }
  }
]`,
  },
  {
    id: "zeus",
    label: "Zeus native",
    ext: ".json",
    description: "Export from another Zeus instance. Array of memory objects.",
    example: `[
  { "content": "User prefers concise answers.", "type": "preference" },
  { "content": "Project deadline is March 2026.", "type": "note" }
]`,
  },
  {
    id: "json",
    label: "Generic JSON",
    ext: ".json",
    description: "Any JSON array of objects or strings. Recognizes content, text, message, body fields automatically.",
    example: `[
  { "text": "Some knowledge to remember.", "type": "fact" },
  "A plain string entry works too."
]`,
  },
  {
    id: "text",
    label: "Plain text / Markdown",
    ext: ".txt / .md",
    description: "Any text file. Content is split by paragraph breaks. Good for notes, documents, and write-ups.",
    example: `First topic or piece of knowledge goes here.
It can span multiple lines.

Second topic starts after a blank line.
The agent will remember both separately.`,
  },
  {
    id: "csv",
    label: "CSV spreadsheet",
    ext: ".csv",
    description: 'CSV with a "content" column (required). Optional "type" column. Semicolons or commas accepted.',
    example: `content,type
"The user's main language is French.",preference
"The project uses React and Fastify.",fact
"Always respond in bullet points when asked.",instruction`,
  },
  {
    id: "pdf",
    label: "PDF document",
    ext: ".pdf",
    description: "Any PDF. Text is extracted and split by paragraph. Good for reports, manuals, and reference docs.",
    example: "(Upload any PDF — text is extracted automatically)",
  },
  {
    id: "xlsx",
    label: "Excel spreadsheet",
    ext: ".xlsx / .xls",
    description: 'Excel file. Recognizes "content" or "text" columns. Falls back to full sheet dump if not found.',
    example: `Column A (content) | Column B (type)
"Important fact here" | fact
"Another entry" | note`,
  },
];

const TYPE_COLORS: Record<string, string> = {
  note: "blue", summary: "blue", preference: "green", fact: "green",
  instruction: "amber", document: "gray", import: "gray",
  chatgpt_conversation: "purple", email_summary: "blue",
};

function MemoryTab({ agent }: { agent: any }) {
  const [memories, setMemories] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");
  const [showGuide, setShowGuide] = useState(false);
  const [openFormat, setOpenFormat] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.getMemory(agent.id).then(setMemories);
  useEffect(() => { load(); }, [agent.id]);

  const add = async () => {
    if (!content.trim()) return;
    await api.addMemory(agent.id, { content, type });
    setContent("");
    load();
  };

  const del = async (memId: string) => {
    await api.deleteMemory(agent.id, memId);
    load();
  };

  const handleFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.importMemory(agent.id, file);
      setImportResult({ ok: true, ...result });
      load();
    } catch (e: any) {
      setImportResult({ ok: false, message: e.message });
    } finally {
      setImporting(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const filtered = search.trim()
    ? memories.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()) || m.type.includes(search.toLowerCase()))
    : memories;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Import drop zone */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Import data</h3>
          <button onClick={() => setShowGuide(!showGuide)} className="text-[10px] px-2 py-1 rounded border"
            style={{ color: "var(--accent)", borderColor: "var(--accent)", background: showGuide ? "var(--accent-bg)" : "transparent" }}>
            {showGuide ? "Hide formats" : "View formats"}
          </button>
        </div>

        {/* Format guide */}
        {showGuide && (
          <div className="mb-3 rounded-lg border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
            {FORMAT_GUIDE.map((fmt) => (
              <div key={fmt.id}>
                <button
                  onClick={() => setOpenFormat(openFormat === fmt.id ? null : fmt.id)}
                  className="w-full text-left px-3 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{fmt.label}</span>
                    <span className="text-[10px] font-mono px-1.5 rounded" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>{fmt.ext}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{openFormat === fmt.id ? "▲" : "▼"}</span>
                </button>
                {openFormat === fmt.id && (
                  <div className="px-3 pb-3 space-y-2">
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{fmt.description}</p>
                    <pre className="text-[10px] rounded p-2 overflow-x-auto whitespace-pre-wrap"
                      style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {fmt.example}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
          style={{
            borderColor: dragging ? "var(--accent)" : "var(--border)",
            background: dragging ? "var(--accent-bg)" : "var(--bg-input)",
          }}>
          <input ref={fileRef} type="file" className="hidden"
            accept=".json,.txt,.md,.csv,.pdf,.xlsx,.xls"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {importing ? (
            <p className="text-sm" style={{ color: "var(--accent)" }}>Importing...</p>
          ) : (
            <>
              <p className="text-sm mb-1" style={{ color: dragging ? "var(--accent)" : "var(--text-secondary)" }}>
                Drop file here or click to browse
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                JSON · TXT · MD · CSV · PDF · XLSX — up to 20MB
              </p>
            </>
          )}
        </div>

        {importResult && (
          <div className="mt-2 rounded-md px-3 py-2 flex items-center gap-2"
            style={{ background: importResult.ok ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${importResult.ok ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
            <span className="text-xs font-medium" style={{ color: importResult.ok ? "#4ade80" : "#f87171" }}>
              {importResult.ok ? "✓" : "✗"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{importResult.message}</span>
            {importResult.ok && importResult.format && (
              <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>
                format: {importResult.format} · skipped: {importResult.skipped ?? 0}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Manual add */}
      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Add manually</h3>
        <div className="flex gap-2">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="note">Note</option>
            <option value="preference">Preference</option>
            <option value="fact">Fact</option>
            <option value="instruction">Instruction</option>
            <option value="summary">Summary</option>
          </Select>
          <Input value={content} onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Memory content..." className="flex-1" />
          <Btn variant="primary" onClick={add} disabled={!content.trim()}>Add</Btn>
        </div>
      </Card>

      {/* Memory list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {memories.length} memor{memories.length === 1 ? "y" : "ies"}
          </span>
          {memories.length > 5 && (
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." className="w-40" style={{ fontSize: 11, padding: "4px 8px" }} />
          )}
        </div>
        <div className="space-y-1.5">
          {filtered.map((m) => (
            <div key={m.id} className="group rounded-lg border px-3 py-2.5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Badge color={(TYPE_COLORS[m.type] || "gray") as any}>{m.type}</Badge>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {new Date(m.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <button onClick={() => del(m.id)}
                  className="ml-auto text-[10px] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  style={{ color: "#f87171" }}>Delete</button>
              </div>
              <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {m.content.slice(0, 300)}{m.content.length > 300 ? "…" : ""}
              </p>
            </div>
          ))}
          {filtered.length === 0 && memories.length === 0 && (
            <EmptyState>No memories yet. Import a file or add manually.</EmptyState>
          )}
          {filtered.length === 0 && memories.length > 0 && (
            <EmptyState>No matches for "{search}"</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketsTab({ agent }: { agent: any }) {
  return (
    <div className="max-w-2xl space-y-2">
      {(agent.tickets || []).map((t: any) => (
        <Card key={t.id}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</span>
            <Badge color={t.status === "done" ? "green" : t.status === "failed" ? "red" : "blue"}>{t.status}</Badge>
          </div>
          {t.output && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{t.output.slice(0, 200)}</p>}
        </Card>
      ))}
      {(agent.tickets || []).length === 0 && <EmptyState>No tickets.</EmptyState>}
    </div>
  );
}

function SkillsTab({ agent, onUpdate }: { agent: any; onUpdate: () => void }) {
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const assigned = new Set((agent.agentSkills || []).map((as: any) => as.skillId));
  useEffect(() => { api.getSkills().then(setAllSkills); }, []);

  return (
    <div className="max-w-2xl">
      <h3 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Assigned</h3>
      <div className="space-y-1.5 mb-5">
        {(agent.agentSkills || []).map((as: any) => (
          <div key={as.id} className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>{as.skill.name}</span>
            <button onClick={async () => { await api.removeSkill(agent.id, as.skillId); onUpdate(); }}
              className="text-[10px]" style={{ color: "#f87171" }}>Remove</button>
          </div>
        ))}
        {(agent.agentSkills || []).length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>None</p>}
      </div>
      <h3 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Available</h3>
      <div className="space-y-1.5">
        {allSkills.filter((s) => !assigned.has(s.id)).map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{s.name}</span>
            <button onClick={async () => { await api.assignSkill(agent.id, s.id); onUpdate(); }}
              className="text-[10px]" style={{ color: "#4ade80" }}>Assign</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelegramTab({ agent }: { agent: any }) {
  const [botStatus, setBotStatus] = useState<any>({ running: false });
  const [code, setCode] = useState<string | null>(null);
  const [pairings, setPairings] = useState<any[]>([]);
  const [gen, setGen] = useState(false);

  useEffect(() => {
    api.telegramStatus().then(setBotStatus);
    api.telegramPairings().then((all) => setPairings(all.filter((p: any) => p.agent.id === agent.id)));
  }, [agent.id]);

  const genCode = async () => { setGen(true); try { const r = await api.telegramPair(agent.id); setCode(r.code); } finally { setGen(false); } };

  if (!botStatus.running) {
    return <Card><p className="text-xs" style={{ color: "var(--text-muted)" }}>Telegram bot not running. Start it in Settings.</p></Card>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>@{botStatus.username}</span>
        </div>
        <Btn variant="primary" onClick={genCode} disabled={gen}>{gen ? "..." : "Generate Pairing Code"}</Btn>
        {code && (
          <div className="mt-3 rounded-lg p-4 text-center border" style={{ borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
            <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>/pair</p>
            <p className="text-2xl font-mono font-bold tracking-widest" style={{ color: "var(--accent)" }}>{code}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Expires in 10 minutes</p>
          </div>
        )}
      </Card>
      {pairings.length > 0 && (
        <Card>
          <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Paired chats</h4>
          {pairings.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1.5">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.chatTitle || p.telegramChatId}</span>
              <button onClick={async () => { await api.telegramUnpair(p.id); const all = await api.telegramPairings(); setPairings(all.filter((x: any) => x.agent.id === agent.id)); }}
                className="text-[10px]" style={{ color: "#f87171" }}>Remove</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
