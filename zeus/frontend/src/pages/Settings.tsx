import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Card, PageTitle, Btn, Input, Label, Badge, EmptyState } from "../components/ui";

type Tab = "connections" | "platform" | "agents" | "skills" | "logs" | "access" | "family" | "update";

interface Props { profile?: any; }

export default function Settings({ profile }: Props) {
  const isAdmin = profile?.role === "admin" || profile?.role === "superuser";
  const [tab, setTab] = useState<Tab>(isAdmin ? "connections" : "access");

  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: "connections", label: "Connections", adminOnly: true },
    { key: "platform", label: "Platform" },
    { key: "agents", label: "Agents" },
    { key: "skills", label: "Skills", adminOnly: true },
    { key: "logs", label: "Logs", adminOnly: true },
    { key: "access", label: "Profile" },
    { key: "family", label: "Family", adminOnly: true },
    { key: "update", label: "Update", adminOnly: true },
  ].filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="max-w-4xl">
      <PageTitle>Settings</PageTitle>

      <div className="flex gap-0.5 mb-5 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 text-xs font-medium relative transition-colors"
            style={{ color: tab === t.key ? "var(--accent)" : "var(--text-muted)" }}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />}
          </button>
        ))}
      </div>

      {tab === "connections" && isAdmin && <ConnectionsTab />}
      {tab === "platform" && <PlatformTab isAdmin={isAdmin} />}
      {tab === "agents" && <AgentsTab />}
      {tab === "skills" && isAdmin && <SkillsTab />}
      {tab === "logs" && isAdmin && <LogsTab />}
      {tab === "access" && <AccessTab profile={profile} />}
      {tab === "family" && isAdmin && <FamilyTab profile={profile} />}
      {tab === "update" && isAdmin && <UpdateTab />}
    </div>
  );
}

function ConnectionsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [flightApiKey, setFlightApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => { setSettings(s); if (s.default_model) setModel(s.default_model); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const d: Record<string, string> = { default_model: model };
      if (apiKey) d.openai_api_key = apiKey;
      if (flightApiKey) d.flight_api_key = flightApiKey;
      await api.updateSettings(d);
      setApiKey(""); setFlightApiKey("");
      setSettings(await api.getSettings());
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>OpenAI</h3>
        <div className="space-y-3">
          <div><Label>API Key</Label><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={settings.openai_api_key || "sk-..."} /></div>
          <div><Label>Model</Label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
              <option value="gpt-4o-mini">gpt-4o-mini</option><option value="gpt-4o">gpt-4o</option><option value="gpt-4-turbo">gpt-4-turbo</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <Btn onClick={async () => { setTesting(true); try { setTestResult(await api.testConnection()); } catch (e:any) { setTestResult({ success: false, error: e.message }); } finally { setTesting(false); } }} disabled={testing}>{testing ? "..." : "Test"}</Btn>
            {testResult && <span className="text-xs" style={{ color: testResult.success ? "#4ade80" : "#f87171" }}>{testResult.success ? "Connected" : testResult.error}</span>}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Email</h3>
        <EmailFields settings={settings} />
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>SMS Alerts (Twilio)</h3>
        <div className="space-y-2">
          <SmsFields settings={settings} onSave={async (d) => { await api.updateSettings(d); setSettings(await api.getSettings()); }} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Flight Tracking (AeroAPI)</h3>
        <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
          Get your API key at <span style={{ color: "var(--accent)" }}>flightaware.com/aeroapi</span>. Enables real-time flight delay and cancellation alerts.
        </p>
        <div><Label>API Key</Label><Input type="password" value={flightApiKey} onChange={(e) => setFlightApiKey(e.target.value)} placeholder={settings.flight_api_key || "Enter AeroAPI key..."} /></div>
      </Card>

      <Btn variant="primary" onClick={save} disabled={saving}>{saving ? "..." : "Save All"}</Btn>

      <ConnectionReviewPanel />
    </div>
  );
}

function EmailFields({ settings }: { settings: Record<string, string> }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [imapR, setImapR] = useState<any>(null);
  const [smtpR, setSmtpR] = useState<any>(null);

  useEffect(() => {
    const f: Record<string, string> = {};
    ["email_imap_host","email_imap_port","email_imap_user","email_imap_pass","email_smtp_host","email_smtp_port","email_smtp_user","email_smtp_pass","email_from_address","email_from_name"].forEach((k) => f[k] = settings[k] || "");
    setForm(f);
  }, [settings]);

  const fld = (label: string, key: string, type = "text") => (
    <div><Label>{label}</Label><Input type={type} value={form[key]||""} onChange={(e) => setForm({...form,[key]:e.target.value})} /></div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Incoming (IMAP)</p>
        {fld("Host","email_imap_host")}{fld("Port","email_imap_port")}{fld("User","email_imap_user")}{fld("Password","email_imap_pass","password")}
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={async () => setImapR(await api.testImap())}>Test</Btn>
          {imapR && <span className="text-[10px]" style={{ color: imapR.success ? "#4ade80" : "#f87171" }}>{imapR.success ? "OK" : imapR.error}</span>}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Outgoing (SMTP)</p>
        {fld("Host","email_smtp_host")}{fld("Port","email_smtp_port")}{fld("User","email_smtp_user")}{fld("Password","email_smtp_pass","password")}
        {fld("From","email_from_name")}{fld("Address","email_from_address")}
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={async () => setSmtpR(await api.testSmtp())}>Test</Btn>
          {smtpR && <span className="text-[10px]" style={{ color: smtpR.success ? "#4ade80" : "#f87171" }}>{smtpR.success ? "OK" : smtpR.error}</span>}
        </div>
      </div>
      <div className="col-span-2">
        <Btn onClick={async () => { await api.updateSettings(form); }}>Save Email Settings</Btn>
      </div>
    </div>
  );
}

function SmsFields({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    twilio_account_sid: settings.twilio_account_sid || "",
    twilio_auth_token: settings.twilio_auth_token || "",
    twilio_from: settings.twilio_from || "",
  });

  useEffect(() => {
    setForm({
      twilio_account_sid: settings.twilio_account_sid || "",
      twilio_auth_token: settings.twilio_auth_token || "",
      twilio_from: settings.twilio_from || "",
    });
  }, [settings]);

  return (
    <div className="space-y-2">
      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        Get credentials at <span style={{ color: "var(--accent)" }}>twilio.com</span>. Each user sets their phone number in Profile.
      </p>
      <div><Label>Account SID</Label><Input value={form.twilio_account_sid} onChange={(e) => setForm({ ...form, twilio_account_sid: e.target.value })} placeholder="ACxxxxxxx" /></div>
      <div><Label>Auth Token</Label><Input type="password" value={form.twilio_auth_token} onChange={(e) => setForm({ ...form, twilio_auth_token: e.target.value })} placeholder="Auth token" /></div>
      <div><Label>From number</Label><Input value={form.twilio_from} onChange={(e) => setForm({ ...form, twilio_from: e.target.value })} placeholder="+1234567890" /></div>
      <Btn onClick={() => onSave(form)}>Save SMS Settings</Btn>
    </div>
  );
}

// ── Platform Status Tab (all users) ─────────────────────────────────────────
function PlatformTab({ isAdmin }: { isAdmin: boolean }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
    api.getUsage().then(setUsage).catch(() => {});
  }, []);

  const integrations = [
    { key: "_status_openai",   label: "AI (OpenAI)",        icon: "🤖", desc: "Powers all assistant conversations and agent tasks" },
    { key: "_status_telegram", label: "Telegram",           icon: "📱", desc: "Push notifications — each user configures their own bot in Profile" },
    { key: "_status_email",    label: "Email (SMTP/IMAP)",  icon: "✉️",  desc: "Email reading and sending" },
    { key: "_status_sms",      label: "SMS (Twilio)",       icon: "💬", desc: "SMS alerts via Twilio" },
  ];

  const on  = (k: string) => settings[k] === "1";
  const fmtCost = (n: number) => "$" + (n || 0).toFixed(4);

  return (
    <div className="max-w-xl space-y-4">
      {/* Integration status */}
      <Card>
        <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Platform integrations</h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          {isAdmin
            ? "Manage credentials in the Connections tab."
            : "Configured by your admin. Contact them to enable or change integrations."}
        </p>
        <div className="space-y-2">
          {integrations.map(({ key, label, icon, desc }) => (
            <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-input)", border: `1px solid ${on(key) ? "rgba(52,211,153,0.25)" : "var(--border)"}` }}>
              <span className="text-base shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: on(key) ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)", color: on(key) ? "#34d399" : "#6b7280" }}>
                    {on(key) ? "Active" : "Not configured"}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Usage summary */}
      {usage && (
        <Card>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>My AI usage this month</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--accent)" }}>{(usage.totalTokens || 0).toLocaleString()}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Tokens used</p>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{usage.requestCount || 0}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Requests</p>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{fmtCost(usage.estimatedCost)}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Est. cost</p>
            </div>
          </div>
          {usage.limit && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                <span>Monthly budget</span>
                <span>{fmtCost(usage.estimatedCost)} / {fmtCost(usage.limit)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (usage.estimatedCost / usage.limit) * 100)}%`, background: "var(--accent)" }} />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Admin shortcut */}
      {isAdmin && (
        <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
          <span className="text-base">🔑</span>
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>You are the admin</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>API keys and integrations are managed in the Connections tab.</p>
          </div>
        </div>
      )}

      {/* Non-admin: request a new external connection */}
      {!isAdmin && <ConnectionRequestPanel />}
    </div>
  );
}

// ── Connection request panel (non-admin users) ───────────────────────────────
function ConnectionRequestPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => api.getConnectionRequests().then(setRequests).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!service.trim()) return;
    setSubmitting(true);
    try {
      await api.createConnectionRequest(service, description);
      setService(""); setDescription("");
      setMsg("Request submitted — an admin will review it.");
      load();
    } catch (e: any) {
      setMsg(e.message);
    } finally { setSubmitting(false); }
  };

  const statusColor = (s: string) => s === "approved" ? "#4ade80" : s === "denied" ? "#f87171" : "#fbbf24";
  const statusIcon  = (s: string) => s === "approved" ? "✅" : s === "denied" ? "❌" : "⏳";

  return (
    <Card>
      <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Request external integration</h3>
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        Need to connect a service not listed above? Submit a request and your admin will review it.
        New external connections require approval to keep the system secure.
      </p>

      {requests.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-xs rounded-md px-2.5 py-2"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
              <span>{statusIcon(r.status)}</span>
              <span className="flex-1 font-medium" style={{ color: "var(--text-primary)" }}>{r.service}</span>
              <span style={{ color: statusColor(r.status) }}>{r.status}</span>
              {r.status === "pending" && (
                <button onClick={async () => { await api.deleteConnectionRequest(r.id); load(); }}
                  className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Input placeholder="Service name (e.g. Slack, Zapier, Google Sheets)" value={service} onChange={(e) => setService(e.target.value)} />
        <Input placeholder="Why do you need it? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        {msg && <p className="text-xs" style={{ color: msg.startsWith("Request") ? "#4ade80" : "#f87171" }}>{msg}</p>}
        <Btn onClick={submit} disabled={submitting || !service.trim()}>{submitting ? "Submitting…" : "Submit request"}</Btn>
      </div>
    </Card>
  );
}

// ── Admin: connection request review ────────────────────────────────────────
function ConnectionReviewPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  const load = () => api.getConnectionRequests().then(setRequests).catch(() => {});
  useEffect(() => { load(); }, []);

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  const review = async (id: string, status: "approved" | "denied") => {
    await api.reviewConnectionRequest(id, status, adminNote[id] || "");
    setAdminNote((n) => { const c = {...n}; delete c[id]; return c; });
    load();
  };

  const statusColor = (s: string) => s === "approved" ? "#4ade80" : s === "denied" ? "#f87171" : "#fbbf24";

  if (requests.length === 0) return (
    <Card>
      <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Connection requests</h3>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>No pending requests from users.</p>
    </Card>
  );

  return (
    <Card>
      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
        Connection requests {pending.length > 0 && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>{pending.length} pending</span>}
      </h3>

      <div className="space-y-3">
        {pending.map((r) => (
          <div key={r.id} className="rounded-lg p-3 space-y-2" style={{ background: "var(--bg-input)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{r.service}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  From: {r.user?.name} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
                {r.description && <p className="text-[10px] mt-1 italic" style={{ color: "var(--text-muted)" }}>{r.description}</p>}
              </div>
            </div>
            <Input placeholder="Admin note (optional, shown to user)" value={adminNote[r.id] || ""}
              onChange={(e) => setAdminNote((n) => ({ ...n, [r.id]: e.target.value }))} />
            <div className="flex gap-2">
              <Btn variant="primary" onClick={() => review(r.id, "approved")}>Approve</Btn>
              <Btn variant="ghost" onClick={() => review(r.id, "denied")}>Deny</Btn>
            </div>
          </div>
        ))}

        {reviewed.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <span className="flex-1" style={{ color: "var(--text-muted)" }}>{r.service} — {r.user?.name}</span>
            <span style={{ color: statusColor(r.status) }}>{r.status}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AgentsTab() {
  const [agents, setAgents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", mission: "" });

  const load = () => api.getAgents().then(setAgents);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await api.createAgent(form);
    setForm({ name: "", role: "", mission: "" });
    setShowCreate(false);
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Manage your AI team</p>
        <Btn variant="primary" onClick={() => setShowCreate(!showCreate)}>+ Agent</Btn>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <div className="space-y-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Role" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} />
              <Input placeholder="Mission" value={form.mission} onChange={(e) => setForm({...form, mission: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 mt-3"><Btn variant="primary" onClick={create}>Create</Btn><Btn onClick={() => setShowCreate(false)}>Cancel</Btn></div>
        </Card>
      )}

      <div className="space-y-2">
        {agents.map((a) => (
          <Link key={a.id} to={`/settings/agents/${a.id}`}>
            <div className="rounded-lg border p-3 flex items-center justify-between transition-colors hover:border-[var(--border-hover)]" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                  <Badge color={a.enabled ? "green" : "red"}>{a.enabled ? "Active" : "Off"}</Badge>
                  {a.isSystem && <Badge color="purple">System</Badge>}
                  {a.moduleSlug && <Badge color="blue">{a.moduleSlug}</Badge>}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.role} — {a.mission}</p>
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.model}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SkillsTab() {
  const [skills, setSkills] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const load = () => { api.getSkills().then(setSkills); api.getSkillGaps().then(setGaps); };
  useEffect(() => { load(); }, []);

  const unresolvedGaps = gaps.filter((g) => !g.resolved);

  return (
    <div className="max-w-2xl">
      {unresolvedGaps.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--accent)" }}>Missing capabilities ({unresolvedGaps.length})</p>
          {unresolvedGaps.map((g) => (
            <Card key={g.id} className="mb-2 border-[rgba(229,162,16,0.15)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>{g.skillName}</span>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{g.triggerContext}</p>
                </div>
                <Btn variant="primary" onClick={async () => { await api.generateStub(g.id); load(); }} style={{ padding: "4px 12px", fontSize: 11 }}>Generate</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Registered skills ({skills.length})</p>
      <div className="space-y-1.5">
        {skills.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>{s.name}</span>
              <Badge color={s.enabled ? "green" : "red"}>{s.enabled ? "On" : "Off"}</Badge>
            </div>
            <button onClick={async () => { await api.updateSkill(s.id, { enabled: !s.enabled }); load(); }}
              className="text-[10px]" style={{ color: s.enabled ? "#f87171" : "#4ade80" }}>
              {s.enabled ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [level, setLevel] = useState("");
  const load = () => api.getLogs({ limit: "100", ...(level ? { level } : {}) }).then(setLogs);
  useEffect(() => { load(); }, [level]);

  return (
    <div className="max-w-3xl">
      <div className="flex gap-1.5 mb-3">
        {["", "info", "warn", "error"].map((l) => (
          <button key={l} onClick={() => setLevel(l)} className="px-3 py-1 rounded-md text-xs"
            style={{ background: level === l ? "var(--accent-bg)" : "var(--bg-input)", color: level === l ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${level === l ? "var(--accent)" : "var(--border)"}` }}>
            {l || "All"}
          </button>
        ))}
        <Btn variant="ghost" onClick={load}>Refresh</Btn>
      </div>
      <div className="space-y-1">
        {logs.map((l) => (
          <div key={l.id} className="flex gap-3 py-1.5 text-xs border-b" style={{ borderColor: "var(--border)" }}>
            <span className="shrink-0 w-28" style={{ color: "var(--text-muted)" }}>{new Date(l.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <Badge color={l.level === "error" ? "red" : l.level === "warn" ? "amber" : "blue"}>{l.level}</Badge>
            <span style={{ color: "var(--text-secondary)" }}>{l.message}</span>
          </div>
        ))}
        {logs.length === 0 && <EmptyState>No logs.</EmptyState>}
      </div>
    </div>
  );
}

function AccessTab({ profile }: { profile?: any }) {
  const [city, setCity] = useState(profile?.city || "");
  const [timezone, setTimezone] = useState(profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [assistantName, setAssistantName] = useState(profile?.assistantName || "");
  const [personality, setPersonality] = useState(profile?.assistantPersonality || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [tgChatId, setTgChatId] = useState(profile?.telegramChatId || "");
  const [alertResult, setAlertResult] = useState<any>(null);
  const [testingAlert, setTestingAlert] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState<any>(null);
  const [profileMsg, setProfileMsg] = useState<any>(null);
  const [changing, setChanging] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Telegram bot state
  const [botToken, setBotToken] = useState(profile?.telegramBotTokenMasked || "");
  const [botStatus, setBotStatus] = useState<{ running: boolean; username: string }>({
    running: profile?.telegramBotRunning || false,
    username: profile?.telegramBotUsername || "",
  });
  const [botAction, setBotAction] = useState(false);
  const [botMsg, setBotMsg] = useState<any>(null);
  const [savingBot, setSavingBot] = useState(false);
  const [pairingCodes, setPairingCodes] = useState<Record<string, string>>({});
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    api.telegramStatus().then(setBotStatus).catch(() => {});
    api.getAgents().then(setAgents).catch(() => {});
  }, []);

  const saveAndStartBot = async () => {
    setSavingBot(true);
    setBotMsg(null);
    try {
      await api.updateMe({ telegramBotToken: botToken });
      const r = await api.telegramRestart();
      if (r.success) {
        setBotStatus({ running: true, username: r.username || "" });
        setBotMsg({ ok: true, t: r.username ? `Bot @${r.username} started` : "Bot started" });
      } else {
        setBotMsg({ ok: false, t: r.error || "Failed to start bot" });
      }
    } catch (e: any) { setBotMsg({ ok: false, t: e.message }); }
    finally { setSavingBot(false); }
  };

  const stopBot = async () => {
    setBotAction(true);
    setBotMsg(null);
    try {
      await api.telegramStop();
      setBotStatus({ running: false, username: "" });
      setBotMsg({ ok: true, t: "Bot stopped" });
    } catch (e: any) { setBotMsg({ ok: false, t: e.message }); }
    finally { setBotAction(false); }
  };

  const generateCode = async (agentId: string) => {
    try {
      const r = await api.telegramPair(agentId);
      setPairingCodes((prev) => ({ ...prev, [agentId]: r.code }));
    } catch (e: any) { setBotMsg({ ok: false, t: e.message }); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.updateMe({ city: city.trim(), timezone, assistantName: assistantName.trim(), assistantPersonality: personality.trim(), phone: phone.trim(), telegramChatId: tgChatId.trim() });
      setProfileMsg({ ok: true, t: "Saved" });
    } catch (e: any) { setProfileMsg({ ok: false, t: e.message }); }
    finally { setSavingProfile(false); }
  };

  const testAlert = async (channel: "telegram" | "sms" | "all") => {
    setTestingAlert(true);
    try {
      // Save first so the latest values are in DB
      await api.updateMe({ phone: phone.trim(), telegramChatId: tgChatId.trim() });
      const r = await api.testAlert(channel);
      setAlertResult(r);
    } catch (e: any) { setAlertResult({ success: false, message: e.message }); }
    finally { setTestingAlert(false); }
  };

  const changePw = async () => {
    if (newPw.length < 4) { setPwMsg({ ok: false, t: "Min 4 characters" }); return; }
    if (newPw !== confPw) { setPwMsg({ ok: false, t: "Don't match" }); return; }
    setChanging(true);
    try { await api.changePassword(curPw, newPw); setPwMsg({ ok: true, t: "Changed" }); setCurPw(""); setNewPw(""); setConfPw(""); }
    catch (e: any) { setPwMsg({ ok: false, t: e.message }); }
    finally { setChanging(false); }
  };

  return (
    <div className="max-w-sm space-y-4">
      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Profile</h3>
        <div className="space-y-3">
          <div>
            <Label>Assistant name</Label>
            <Input value={assistantName} onChange={(e) => setAssistantName(e.target.value)} placeholder="e.g. Gulli, Aria" />
          </div>
          <div>
            <Label>Personality <span style={{ color: "var(--text-muted)", fontSize: 10 }}>(optional)</span></Label>
            <textarea value={personality} onChange={(e) => setPersonality(e.target.value)}
              placeholder="Professional but friendly, concise..."
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px]"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Paris, New York" />
          </div>
          <div>
            <Label>Timezone</Label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
              {Intl.supportedValuesOf("timeZone").map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          {profileMsg && <p className="text-xs" style={{ color: profileMsg.ok ? "#4ade80" : "#f87171" }}>{profileMsg.t}</p>}
          <Btn onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "..." : "Save profile"}</Btn>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Alert channels</h3>
        <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
          Receive reminders and agent alerts via Telegram or SMS. Telegram requires the bot to be started in Connections and your Chat ID configured below.
          Get your Chat ID by messaging <span style={{ color: "var(--accent)" }}>@userinfobot</span> on Telegram.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Telegram Chat ID</Label>
            <Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="e.g. 123456789" />
          </div>
          <div>
            <Label>Phone number <span style={{ color: "var(--text-muted)", fontSize: 10 }}>(for SMS via Twilio)</span></Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Btn variant="ghost" onClick={() => testAlert("telegram")} disabled={testingAlert}>Test Telegram</Btn>
            <Btn variant="ghost" onClick={() => testAlert("sms")} disabled={testingAlert}>Test SMS</Btn>
            <Btn variant="ghost" onClick={() => testAlert("all")} disabled={testingAlert}>{testingAlert ? "..." : "Test All"}</Btn>
            {alertResult && <span className="text-xs" style={{ color: alertResult.success ? "#4ade80" : "#f87171" }}>{alertResult.message}</span>}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Telegram Bot</h3>
        <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
          Create your own bot via <span style={{ color: "var(--accent)" }}>@BotFather</span> on Telegram, paste the token below,
          then start it. Each family member uses their own bot.
        </p>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: botStatus.running ? "#4ade80" : "#6b7280" }} />
          <span className="text-xs" style={{ color: botStatus.running ? "#4ade80" : "var(--text-muted)" }}>
            {botStatus.running ? `Running${botStatus.username ? ` as @${botStatus.username}` : ""}` : "Not running"}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Bot Token</Label>
            <Input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={profile?.telegramBotTokenSet ? "Token saved — enter new to replace" : "1234567890:ABC..."}
            />
            {profile?.telegramBotTokenSet && !botToken && (
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                Token on file: {profile.telegramBotTokenMasked}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Btn variant="primary" onClick={saveAndStartBot} disabled={savingBot || (!botToken && !profile?.telegramBotTokenSet)}>
              {savingBot ? "..." : botStatus.running ? "Save & Restart" : "Save & Start"}
            </Btn>
            {botStatus.running && (
              <Btn onClick={stopBot} disabled={botAction}>{botAction ? "..." : "Stop"}</Btn>
            )}
            {botMsg && <span className="text-xs" style={{ color: botMsg.ok ? "#4ade80" : "#f87171" }}>{botMsg.t}</span>}
          </div>

          {/* Pairing codes */}
          {botStatus.running && agents.length > 0 && (
            <div>
              <Label>Pair an agent</Label>
              <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
                Generate a code, then send <span className="font-mono">/pair CODE</span> to your bot in Telegram.
              </p>
              <div className="space-y-1.5">
                {agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 justify-between rounded-md border px-3 py-1.5"
                    style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                    {pairingCodes[a.id] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>{pairingCodes[a.id]}</span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>expires in 10 min</span>
                      </div>
                    ) : (
                      <Btn variant="ghost" onClick={() => generateCode(a.id)} style={{ padding: "2px 10px", fontSize: 11 }}>
                        Get code
                      </Btn>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Change password</h3>
        <div className="space-y-2">
          <Input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="Current" />
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New" />
          <Input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="Confirm" />
          {pwMsg && <p className="text-xs" style={{ color: pwMsg.ok ? "#4ade80" : "#f87171" }}>{pwMsg.t}</p>}
          <Btn onClick={changePw} disabled={changing}>{changing ? "..." : "Change"}</Btn>
        </div>
      </Card>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = { admin: "Admin", superuser: "Super User", user: "User", guest: "Guest" };

function FamilyTab({ profile }: { profile?: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [newInviteRole, setNewInviteRole] = useState("user");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const load = () => {
    api.getUsers().then(setUsers);
    api.getInvites().then(setInvites);
  };
  useEffect(() => { load(); }, []);

  const createInvite = async () => {
    setCreatingInvite(true);
    try {
      await api.createInvite(newInviteRole);
      load();
    } finally { setCreatingInvite(false); }
  };

  const appUrl = window.location.origin;

  const copyInvite = (code: string) => {
    const msg = `You're invited to join the family on Gulli!\n\nOpen this link: ${appUrl}\nClick "Join the family" and enter your invite code: ${code}\n\nThe code expires in 7 days.`;
    navigator.clipboard.writeText(msg);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the family? Their data will be kept.`)) return;
    await api.deleteUser(id);
    load();
  };

  const changeRole = async (id: string, role: string) => {
    await api.updateUser(id, { role });
    load();
  };

  const activeInvites = invites.filter((i) => !i.usedBy && new Date(i.expiresAt) > new Date());

  return (
    <div className="max-w-2xl space-y-5">
      {/* Members */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Family members ({users.length})</p>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{u.name}</span>
                  {u.id === profile?.id && <span className="text-[10px] ml-1.5" style={{ color: "var(--text-muted)" }}>(you)</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.id !== profile?.id ? (
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                ) : (
                  <Badge color="amber">{ROLE_LABELS[u.role] || u.role}</Badge>
                )}
                {u.id !== profile?.id && (
                  <button onClick={() => deleteUser(u.id, u.name)} className="text-[10px] px-2 py-1 rounded" style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Invite a family member</h3>
        <div className="flex gap-2 mb-3">
          <select value={newInviteRole} onChange={(e) => setNewInviteRole(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <option value="user">User</option>
            <option value="superuser">Super User</option>
            <option value="guest">Guest</option>
          </select>
          <Btn variant="primary" onClick={createInvite} disabled={creatingInvite}>
            {creatingInvite ? "..." : "Generate invite"}
          </Btn>
        </div>

        {/* Always show the app URL */}
        <div className="rounded-md border px-3 py-2 mb-3 flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          <div>
            <p className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Family URL</p>
            <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>{appUrl}</span>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(appUrl); }} className="text-[10px] px-2 py-1 rounded"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            Copy URL
          </button>
        </div>

        {activeInvites.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] mb-1.5" style={{ color: "var(--text-muted)" }}>Active invites (valid 7 days)</p>
            {activeInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
                <div>
                  <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>{inv.code}</span>
                  <span className="text-[10px] ml-2" style={{ color: "var(--text-muted)" }}>{ROLE_LABELS[inv.role] || inv.role}</span>
                </div>
                <button onClick={() => copyInvite(inv.code)} className="text-[10px] px-2 py-1 rounded"
                  style={{ background: copiedCode === inv.code ? "rgba(74,222,128,0.1)" : "var(--bg-card)", color: copiedCode === inv.code ? "#4ade80" : "var(--accent)", border: "1px solid var(--border)" }}>
                  {copiedCode === inv.code ? "Copied!" : "Copy invite"}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
          "Copy invite" copies a ready-to-send message with the URL and code.
        </p>
      </Card>
    </div>
  );
}

function UpdateTab() {
  const [version, setVersion] = useState<any>(null);
  const [check, setCheck] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);

  useEffect(() => { api.getVersion().then(setVersion); }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    setCheck(null);
    try { setCheck(await api.checkUpdate()); }
    catch (e: any) { setCheck({ error: e.message }); }
    finally { setChecking(false); }
  };

  const applyUpdate = async () => {
    if (!confirm("This will update ZEUS and restart the service. Continue?")) return;
    setUpdating(true);
    try {
      const r = await api.applyUpdate();
      setUpdateResult(r);
      if (r.success) setTimeout(() => window.location.reload(), 5000);
    } catch (e: any) { setUpdateResult({ success: false, error: e.message }); }
    finally { setUpdating(false); }
  };

  return (
    <div className="max-w-xl space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Current version</h3>
          <span className="text-sm font-mono" style={{ color: "var(--accent)" }}>v{version?.current || "..."}</span>
        </div>
        <Btn onClick={checkForUpdates} disabled={checking}>{checking ? "Checking..." : "Check for updates"}</Btn>

        {check && !check.error && (
          <div className="mt-3 rounded-lg p-3 border" style={{ borderColor: check.upToDate ? "var(--border)" : "var(--accent)", background: check.upToDate ? "var(--bg-input)" : "var(--accent-bg)" }}>
            {check.upToDate ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>You're on the latest version.</p>
            ) : (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--accent)" }}>
                  Update available ({check.commitsAhead} change{check.commitsAhead > 1 ? "s" : ""})
                </p>
                <Btn variant="primary" onClick={applyUpdate} disabled={updating}>
                  {updating ? "Updating... (this may take a minute)" : "Install update"}
                </Btn>
              </div>
            )}
          </div>
        )}

        {check?.error && <p className="text-xs mt-2" style={{ color: "#f87171" }}>{check.error}</p>}

        {updateResult && (
          <div className="mt-3 rounded-lg p-3" style={{ background: updateResult.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
            <p className="text-xs" style={{ color: updateResult.success ? "#4ade80" : "#f87171" }}>
              {updateResult.success ? `${updateResult.message} Page will reload in 5 seconds.` : updateResult.error}
            </p>
          </div>
        )}
      </Card>

      {version?.changelog && (
        <Card>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>What's new</h3>
          <div className="space-y-4">
            {(check?.remoteChangelog?.length > 0 ? check.remoteChangelog : version.changelog).map((entry: any) => (
              <div key={entry.version}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-medium" style={{ color: "var(--accent)" }}>v{entry.version}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{entry.date}</span>
                </div>
                {entry.title && <p className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{entry.title}</p>}
                <ul className="space-y-0.5">
                  {entry.changes.map((c: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--text-secondary)" }}>·</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
