import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Input, Label } from "../components/ui";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [tgToken, setTgToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [tgStatus, setTgStatus] = useState<any>({ running: false });
  const [tgAction, setTgAction] = useState(false);
  const [pairings, setPairings] = useState<any[]>([]);

  useEffect(() => {
    api.getSettings().then((s) => { setSettings(s); if (s.default_model) setModel(s.default_model); });
    loadTg();
  }, []);

  const loadTg = () => { api.telegramStatus().then(setTgStatus); api.telegramPairings().then(setPairings); };

  const save = async () => {
    setSaving(true);
    try {
      const d: Record<string, string> = { default_model: model };
      if (apiKey) d.openai_api_key = apiKey;
      if (tgToken) d.telegram_bot_token = tgToken;
      await api.updateSettings(d);
      setApiKey(""); setTgToken("");
      setSettings(await api.getSettings());
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setTestResult(null);
    try { setTestResult(await api.testConnection()); } catch (e: any) { setTestResult({ success: false, error: e.message }); }
    finally { setTesting(false); }
  };

  const toggleBot = async () => {
    setTgAction(true);
    try { if (tgStatus.running) await api.telegramStop(); else { const r = await api.telegramStart(); if (!r.success) alert(r.error); } loadTg(); }
    finally { setTgAction(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageTitle>Settings</PageTitle>

      {/* OpenAI */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>OpenAI</h3>
        <div className="space-y-3">
          <div>
            <Label>API Key</Label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings.openai_api_key || "sk-..."} />
            {settings.openai_api_key && <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{settings.openai_api_key}</p>}
          </div>
          <div>
            <Label>Model</Label>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <Btn onClick={test} disabled={testing}>{testing ? "..." : "Test Connection"}</Btn>
            {testResult && (
              <span className="text-xs" style={{ color: testResult.success ? "#4ade80" : "#f87171" }}>
                {testResult.success ? "Connected" : testResult.error}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Telegram */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>Telegram</h3>
        <div className="space-y-3">
          <div>
            <Label>Bot Token</Label>
            <Input type="password" value={tgToken} onChange={(e) => setTgToken(e.target.value)}
              placeholder={settings.telegram_bot_token || "Enter token..."} />
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>From @BotFather</p>
          </div>
          <div className="flex items-center gap-3">
            <Btn onClick={toggleBot} disabled={tgAction}
              style={tgStatus.running ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" } : {}}>
              {tgAction ? "..." : tgStatus.running ? "Stop" : "Start Bot"}
            </Btn>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${tgStatus.running ? "bg-green-500" : "bg-gray-600"}`} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tgStatus.running ? `@${tgStatus.username}` : "Off"}</span>
            </div>
          </div>
          {pairings.length > 0 && (
            <div>
              <Label>Active Pairings</Label>
              {pairings.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.chatTitle} → {p.agent.name}</span>
                  <button onClick={async () => { await api.telegramUnpair(p.id); loadTg(); }}
                    className="text-[10px]" style={{ color: "#f87171" }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Email */}
      <EmailSection settings={settings} onSave={save} />

      <Btn variant="primary" onClick={save} disabled={saving} className="mb-6">
        {saving ? "..." : "Save All Settings"}
      </Btn>

      {/* Access */}
      <AccessSection />
    </div>
  );
}

function EmailSection({ settings, onSave }: { settings: Record<string, string>; onSave: () => void }) {
  const keys = ["email_imap_host","email_imap_port","email_imap_user","email_imap_pass","email_smtp_host","email_smtp_port","email_smtp_user","email_smtp_pass","email_from_address","email_from_name"];
  const [form, setForm] = useState<Record<string, string>>({});
  const [imapR, setImapR] = useState<any>(null);
  const [smtpR, setSmtpR] = useState<any>(null);
  const [t, setT] = useState("");
  const [s, setS] = useState(false);

  useEffect(() => {
    const f: Record<string, string> = {};
    keys.forEach((k) => f[k] = settings[k] || "");
    setForm(f);
  }, [settings]);

  const saveEmail = async () => { setS(true); try { await api.updateSettings(form); onSave(); } finally { setS(false); } };
  const f = (label: string, key: string, type = "text") => (
    <div><Label>{label}</Label><Input type={type} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>
  );

  return (
    <Card className="mb-4">
      <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>Email</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>IMAP (incoming)</p>
          {f("Host","email_imap_host")}{f("Port","email_imap_port")}{f("User","email_imap_user")}{f("Password","email_imap_pass","password")}
          <div className="flex items-center gap-2">
            <Btn variant="ghost" onClick={async () => { setT("i"); setImapR(await api.testImap()); setT(""); }} disabled={t==="i"}>Test</Btn>
            {imapR && <span className="text-[10px]" style={{ color: imapR.success ? "#4ade80" : "#f87171" }}>{imapR.success ? `OK (${imapR.count})` : imapR.error}</span>}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>SMTP (outgoing)</p>
          {f("Host","email_smtp_host")}{f("Port","email_smtp_port")}{f("User","email_smtp_user")}{f("Password","email_smtp_pass","password")}
          {f("From Name","email_from_name")}{f("From Address","email_from_address")}
          <div className="flex items-center gap-2">
            <Btn variant="ghost" onClick={async () => { setT("s"); setSmtpR(await api.testSmtp()); setT(""); }} disabled={t==="s"}>Test</Btn>
            {smtpR && <span className="text-[10px]" style={{ color: smtpR.success ? "#4ade80" : "#f87171" }}>{smtpR.success ? "OK" : smtpR.error}</span>}
          </div>
        </div>
      </div>
      <Btn onClick={saveEmail} disabled={s} className="mt-3">{s ? "..." : "Save Email"}</Btn>
    </Card>
  );
}

function AccessSection() {
  const [vm, setVm] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState<any>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => { api.authStatus().then((s) => { if (s.vmAddress) setVm(s.vmAddress); }); }, []);

  const changePw = async () => {
    if (newPw.length < 4) { setPwMsg({ ok: false, t: "Min 4 chars" }); return; }
    if (newPw !== confPw) { setPwMsg({ ok: false, t: "Don't match" }); return; }
    setChanging(true);
    try { await api.changePassword(curPw, newPw); setPwMsg({ ok: true, t: "Changed" }); setCurPw(""); setNewPw(""); setConfPw(""); }
    catch (e: any) { setPwMsg({ ok: false, t: e.message }); }
    finally { setChanging(false); }
  };

  return (
    <>
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Remote Access</h3>
        <div className="flex gap-2 mb-2">
          <Input value={vm} onChange={(e) => setVm(e.target.value)} placeholder="VM IP" className="flex-1" />
          <Btn onClick={async () => { await api.updateVmAddress(vm); }}>Update</Btn>
        </div>
        {vm && (
          <div className="rounded-md p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
            <a href={`http://${vm}:3000`} target="_blank" rel="noopener" className="text-sm font-mono" style={{ color: "var(--accent)" }}>
              http://{vm}:3000
            </a>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Change Password</h3>
        <div className="space-y-2 max-w-xs">
          <Input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="Current" />
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New" />
          <Input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="Confirm" />
          {pwMsg && <p className="text-xs" style={{ color: pwMsg.ok ? "#4ade80" : "#f87171" }}>{pwMsg.t}</p>}
          <Btn onClick={changePw} disabled={changing}>{changing ? "..." : "Change"}</Btn>
        </div>
      </Card>
    </>
  );
}
