import { useState } from "react";
import { api } from "../api";

interface Props { onComplete: () => void; }

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [assistantName, setAssistantName] = useState("Gulli");
  const [assistantPersonality, setAssistantPersonality] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const err = (msg: string) => { setError(msg); return false; };
  const validate = () => {
    setError("");
    if (step === 1 && !name.trim()) return err("Enter your name.");
    if (step === 1 && password.length < 4) return err("Password must be at least 4 characters.");
    if (step === 1 && password !== confirmPassword) return err("Passwords don't match.");
    return true;
  };
  const next = () => { if (validate()) setStep(step + 1); };

  const finish = async () => {
    setSaving(true);
    try {
      await api.setup(name.trim(), password, assistantName.trim() || "Gulli", assistantPersonality.trim(), city.trim(), timezone);
      onComplete();
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
          <div className="text-2xl font-semibold tracking-wide mb-1" style={{ color: "var(--accent)" }}>GULLI</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Family AI setup</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="h-1 rounded-full transition-all" style={{
              width: step >= s ? 48 : 24,
              background: step >= s ? "var(--accent)" : "var(--border)",
            }} />
          ))}
        </div>

        <div className="rounded-xl border p-7" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>Create your admin account</p>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Your name</label>
                {input(name, setName, "e.g. Marcel", "text", true)}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                {input(password, setPassword, "Min 4 characters", "password")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm password</label>
                {input(confirmPassword, setConfirmPassword, "Repeat password", "password", false, next)}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Your personal assistant</p>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Assistant name</label>
                {input(assistantName, setAssistantName, "e.g. Gulli, Atlas", "text", true)}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Personality <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <textarea value={assistantPersonality} onChange={(e) => setAssistantPersonality(e.target.value)}
                  placeholder="Professional but friendly, concise, proactive..."
                  className="w-full rounded-md border px-3 py-2.5 text-sm min-h-[70px]"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>City</label>
                {input(city, setCity, "e.g. Paris, New York, Toronto")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border px-3 py-2.5 text-sm"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  {Intl.supportedValuesOf("timeZone").map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Review & launch</p>
              {[
                ["Name", name],
                ["Assistant", assistantName || "Gulli"],
                ["Location", city || "Not set"],
                ["Timezone", timezone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ color: "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
              <div className="rounded-lg p-3 border mt-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  After setup, go to <strong>Settings → Connections</strong> and add your <strong>OpenAI API key</strong> to activate your agents.
                </p>
              </div>
              <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  You're the <strong>Admin</strong>. Invite family members from <strong>Settings → Family</strong> once you're in.
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-xs mt-3" style={{ color: "#f87171" }}>{error}</p>}

          <div className="flex gap-2 mt-5">
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); setError(""); }}
                className="px-4 py-2.5 rounded-md text-sm" style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                Back
              </button>
            )}
            {step < 3 && (
              <button onClick={next} className="flex-1 py-2.5 rounded-md text-sm font-medium" style={{ background: "var(--accent)", color: "#000" }}>
                Next
              </button>
            )}
            {step === 3 && (
              <button onClick={finish} disabled={saving} className="flex-1 py-2.5 rounded-md text-sm font-medium disabled:opacity-40" style={{ background: "var(--accent)", color: "#000" }}>
                {saving ? "Setting up..." : "Launch"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
