import { useState } from "react";
import { api } from "../api";

interface Props { onComplete: () => void; }

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [vmAddress, setVmAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [assistantName, setAssistantName] = useState("Zeus");
  const [assistantPersonality, setAssistantPersonality] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessUrl, setAccessUrl] = useState("");

  const err = (msg: string) => { setError(msg); return false; };
  const validate = () => {
    setError("");
    if (step === 1 && !userName.trim()) return err("Enter your name.");
    if (step === 2 && !vmAddress.trim()) return err("Enter the VM IP.");
    if (step === 3 && password.length < 4) return err("Min 4 characters.");
    if (step === 3 && password !== confirmPassword) return err("Passwords don't match.");
    return true;
  };
  const next = () => { if (validate()) setStep(step + 1); };

  const finish = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const addr = vmAddress.trim().replace(/\/+$/, "");
      await api.onboard(password, addr, userName.trim(), assistantName.trim() || "Zeus", assistantPersonality.trim(), city.trim(), timezone);
      setAccessUrl(`http://${addr}:3000`);
      setStep(5);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const input = (value: string, onChange: (v: string) => void, placeholder: string, type = "text", autoFocus = false, onEnter?: () => void) => (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
      onKeyDown={onEnter ? (e) => e.key === "Enter" && onEnter() : undefined}
      className="w-full rounded-md border px-3 py-2.5 text-sm"
      style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-root)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-semibold tracking-wide mb-1" style={{ color: "var(--accent)" }}>ZEUS</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Setup</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[1,2,3,4].map((s) => (
            <div key={s} className="h-1 rounded-full transition-all" style={{
              width: step >= s ? 40 : 20,
              background: step >= s ? "var(--accent)" : "var(--border)",
            }} />
          ))}
        </div>

        <div className="rounded-xl border p-7" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>Welcome. Let's set up your workspace.</p>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Your name</label>
                {input(userName, setUserName, "e.g. Marcel", "text", true, next)}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Name your assistant</label>
                {input(assistantName, setAssistantName, "e.g. Zeus, Jarvis")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Personality <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <textarea value={assistantPersonality} onChange={(e) => setAssistantPersonality(e.target.value)}
                  placeholder="Professional but friendly, concise, proactive..."
                  className="w-full rounded-md border px-3 py-2.5 text-sm min-h-[70px]"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Your location & network</p>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>City</label>
                {input(city, setCity, "e.g. Paris, New York, Toronto", "text", true)}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border px-3 py-2.5 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  {Intl.supportedValuesOf("timeZone").map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>VM IP address</label>
                {input(vmAddress, setVmAddress, "e.g. 192.168.1.100")}
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Run <code className="px-1 rounded" style={{ background: "var(--bg-input)" }}>hostname -I</code> on the VM to find it.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Set a password</p>
              {input(password, setPassword, "Password", "password", true)}
              {input(confirmPassword, setConfirmPassword, "Confirm", "password", false, next)}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Review</p>
              {[["Name", userName], ["Assistant", assistantName || "Zeus"], ["Location", city || "Not set"], ["Timezone", timezone], ["IP", vmAddress]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ color: "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4">
              <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>Ready.</p>
              <div className="rounded-lg p-4 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
                <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Access URL</p>
                <a href={accessUrl} className="text-sm font-mono underline break-all" style={{ color: "var(--accent)" }}>{accessUrl}</a>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Next: add your OpenAI API key in Settings, then chat with {assistantName || "Zeus"}.</p>
            </div>
          )}

          {error && <p className="text-xs mt-3" style={{ color: "#f87171" }}>{error}</p>}

          <div className="flex gap-2 mt-5">
            {step > 1 && step < 5 && (
              <button onClick={() => { setStep(step - 1); setError(""); }}
                className="px-4 py-2.5 rounded-md text-sm" style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                Back
              </button>
            )}
            {step < 4 && (
              <button onClick={next} className="flex-1 py-2.5 rounded-md text-sm font-medium" style={{ background: "var(--accent)", color: "#000" }}>
                Next
              </button>
            )}
            {step === 4 && (
              <button onClick={finish} disabled={saving} className="flex-1 py-2.5 rounded-md text-sm font-medium disabled:opacity-40" style={{ background: "var(--accent)", color: "#000" }}>
                {saving ? "Setting up..." : "Launch"}
              </button>
            )}
            {step === 5 && (
              <button onClick={onComplete} className="flex-1 py-2.5 rounded-md text-sm font-medium" style={{ background: "var(--accent)", color: "#000" }}>
                Enter Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
