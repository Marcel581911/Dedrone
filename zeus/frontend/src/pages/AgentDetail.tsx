import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

type Tab = "config" | "chat" | "memory" | "tickets" | "skills";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("config");
  const [error, setError] = useState("");

  const load = () => {
    if (!id) return;
    api.getAgent(id).then(setAgent).catch((e) => setError(e.message));
  };
  useEffect(load, [id]);

  if (error) return <Wrap><p className="text-red-400">{error}</p></Wrap>;
  if (!agent) return <Wrap><p className="text-gray-500">Loading...</p></Wrap>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "config", label: "Config" },
    { key: "chat", label: "Chat" },
    { key: "memory", label: "Memory" },
    { key: "tickets", label: "Tickets" },
    { key: "skills", label: "Skills" },
  ];

  return (
    <Wrap>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/agents" className="text-gray-500 hover:text-gray-300">← Agents</Link>
        <span className="text-gray-700">/</span>
        <h2 className="text-2xl font-bold">{agent.name}</h2>
        <span className={`text-xs px-2 py-0.5 rounded ${agent.enabled ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
          {agent.enabled ? "Active" : "Disabled"}
        </span>
      </div>

      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "config" && <ConfigTab agent={agent} onUpdate={load} />}
      {tab === "chat" && <ChatTab agent={agent} />}
      {tab === "memory" && <MemoryTab agent={agent} onUpdate={load} />}
      {tab === "tickets" && <TicketsTab agent={agent} />}
      {tab === "skills" && <SkillsTab agent={agent} onUpdate={load} />}
    </Wrap>
  );
}

function ConfigTab({ agent, onUpdate }: { agent: any; onUpdate: () => void }) {
  const [form, setForm] = useState({ ...agent, tags: JSON.parse(agent.tags || "[]").join(", ") });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateAgent(agent.id, {
        name: form.name,
        description: form.description,
        role: form.role,
        mission: form.mission,
        systemPrompt: form.systemPrompt,
        model: form.model,
        temperature: parseFloat(form.temperature),
        maxTokens: parseInt(form.maxTokens),
        enabled: form.enabled,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      });
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, type = "text", multiline = false) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={(form as any)[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm min-h-[100px]"
        />
      ) : (
        <input
          type={type}
          value={(form as any)[key]}
          onChange={(e) => setForm({ ...form, [key]: type === "number" ? e.target.value : e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      {field("Name", "name")}
      {field("Description", "description")}
      {field("Role", "role")}
      {field("Mission", "mission")}
      {field("System Prompt", "systemPrompt", "text", true)}
      <div className="grid grid-cols-3 gap-4">
        {field("Model", "model")}
        {field("Temperature", "temperature", "number")}
        {field("Max Tokens", "maxTokens", "number")}
      </div>
      {field("Tags (comma-separated)", "tags")}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm text-gray-400">Enabled</label>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function ChatTab({ agent }: { agent: any }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getConversations(agent.id).then((convs) => {
      setConversations(convs);
      if (convs.length > 0) selectConv(convs[0]);
    });
  }, [agent.id]);

  const selectConv = async (conv: any) => {
    setActiveConv(conv);
    const msgs = await api.getMessages(conv.id);
    setMessages(msgs);
  };

  const newConversation = async () => {
    const conv = await api.createConversation(agent.id);
    setConversations([conv, ...conversations]);
    setActiveConv(conv);
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const msg = input;
    setInput("");
    setMessages((prev) => [...prev, { id: "temp", role: "user", content: msg, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      const result = await api.chat(agent.id, activeConv.id, msg);
      const allMessages = await api.getMessages(activeConv.id);
      setMessages(allMessages);
      const convs = await api.getConversations(agent.id);
      setConversations(convs);
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: "err", role: "assistant", content: `Error: ${e.message}`, createdAt: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)]">
      <div className="w-56 bg-gray-900 border border-gray-800 rounded-lg overflow-auto">
        <div className="p-3 border-b border-gray-800">
          <button onClick={newConversation} className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm">
            + New Chat
          </button>
        </div>
        <div className="p-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConv(c)}
              className={`w-full text-left px-3 py-2 rounded text-sm truncate ${
                activeConv?.id === c.id ? "bg-gray-800 text-amber-400" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-lg">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            Select or create a conversation
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-amber-900/30 text-amber-100"
                      : "bg-gray-800 text-gray-200"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-400">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2.5 text-sm focus:border-amber-600 outline-none"
                  disabled={sending}
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium disabled:opacity-50"
                >
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

function MemoryTab({ agent, onUpdate }: { agent: any; onUpdate: () => void }) {
  const [memories, setMemories] = useState<any[]>(agent.memories || []);
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");

  const load = () => api.getMemory(agent.id).then(setMemories);
  useEffect(() => { load(); }, [agent.id]);

  const add = async () => {
    if (!content.trim()) return;
    await api.addMemory(agent.id, { content, type });
    setContent("");
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value="note">Note</option>
            <option value="summary">Summary</option>
          </select>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a memory entry..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          />
          <button onClick={add} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">Add</button>
        </div>
      </div>

      <div className="space-y-3">
        {memories.map((m) => (
          <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{m.type}</span>
              <span className="text-xs text-gray-600">{new Date(m.createdAt).toLocaleString()}</span>
              {m.ticketId && <span className="text-xs text-blue-400">Ticket: {m.ticketId.slice(0, 8)}</span>}
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {memories.length === 0 && <p className="text-gray-600 text-sm">No memories yet.</p>}
      </div>
    </div>
  );
}

function TicketsTab({ agent }: { agent: any }) {
  const tickets = agent.tickets || [];
  return (
    <div className="max-w-3xl">
      <div className="space-y-3">
        {tickets.map((t: any) => (
          <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{t.title}</h4>
              <StatusBadge status={t.status} />
            </div>
            <p className="text-sm text-gray-400">{t.description}</p>
            {t.output && (
              <div className="mt-3 bg-gray-800 rounded p-3 text-sm text-gray-300">
                <p className="text-xs text-gray-500 mb-1">Output:</p>
                <p className="whitespace-pre-wrap">{t.output}</p>
              </div>
            )}
          </div>
        ))}
        {tickets.length === 0 && <p className="text-gray-600 text-sm">No tickets assigned to this agent.</p>}
      </div>
    </div>
  );
}

function SkillsTab({ agent, onUpdate }: { agent: any; onUpdate: () => void }) {
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const assignedIds = new Set((agent.agentSkills || []).map((as: any) => as.skillId));

  useEffect(() => {
    api.getSkills().then(setAllSkills);
  }, []);

  const assign = async (skillId: string) => {
    await api.assignSkill(agent.id, skillId);
    onUpdate();
  };

  const remove = async (skillId: string) => {
    await api.removeSkill(agent.id, skillId);
    onUpdate();
  };

  return (
    <div className="max-w-3xl">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Assigned Skills</h3>
      <div className="space-y-2 mb-6">
        {(agent.agentSkills || []).map((as: any) => (
          <div key={as.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div>
              <span className="font-medium text-sm">{as.skill.name}</span>
              <span className="text-xs text-gray-500 ml-2">{as.skill.description}</span>
            </div>
            <button onClick={() => remove(as.skillId)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>
        ))}
        {(agent.agentSkills || []).length === 0 && <p className="text-gray-600 text-sm">No skills assigned.</p>}
      </div>

      <h3 className="text-sm font-semibold text-gray-400 mb-3">Available Skills</h3>
      <div className="space-y-2">
        {allSkills.filter((s) => !assignedIds.has(s.id)).map((s) => (
          <div key={s.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div>
              <span className="font-medium text-sm">{s.name}</span>
              <span className="text-xs text-gray-500 ml-2">{s.description}</span>
            </div>
            <button onClick={() => assign(s.id)} className="text-xs text-green-400 hover:text-green-300">Assign</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    queued: "bg-blue-900/50 text-blue-400",
    in_progress: "bg-yellow-900/50 text-yellow-400",
    done: "bg-green-900/50 text-green-400",
    failed: "bg-red-900/50 text-red-400",
    blocked: "bg-gray-700/50 text-gray-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[status] || "bg-gray-800 text-gray-400"}`}>
      {status}
    </span>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="p-6 max-w-6xl mx-auto">{children}</div>;
}
