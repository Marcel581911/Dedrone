import { useState } from "react";
import { api } from "../api";

interface Props { onLogin: () => void; }

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login fields
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [inviteCode, setInviteCode] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [assistantName, setAssistantName] = useState("Gulli");
  const [city, setCity] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!loginName.trim() || !loginPassword) return;
    setLoading(true);
    setError("");
    try {
      await api.login(loginName.trim(), loginPassword);
      onLogin();
    } catch (e: any) {
      setError(e.message === "not_authenticated" ? "Invalid name or password." : e.message);
    } finally { setLoading(false); }
  };

  const register = async () => {
    if (!inviteCode.trim()) { setError("Enter your invite code."); return; }
    if (!regName.trim()) { setError("Enter your name."); return; }
    if (regPassword.length < 4) { setError("Password must be at least 4 characters."); return; }
    if (regPassword !== regConfirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    setError("");
    try {
      await api.register(inviteCode.trim(), regName.trim(), regPassword, assistantName.trim() || "Gulli", "", city.trim(), Intl.DateTimeFormat().resolvedOptions().timeZone);
      onLogin();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const inp = (value: string, onChange: (v: string) => void, placeholder: string, type = "text", autoFocus = false, onEnter?: () => void) => (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
      onKeyDown={onEnter ? (e) => e.key === "Enter" && onEnter() : undefined}
      className="w-full rounded-md border px-3 py-2.5 text-sm"
      style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-root)" }}>
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold tracking-wide mb-1" style={{ color: "var(--accent)" }}>ZEUS</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "Sign in to your workspace" : "Join the family"}
          </p>
        </div>

        <div className="rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {mode === "login" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Name</label>
                {inp(loginName, setLoginName, "Your name", "text", true)}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                {inp(loginPassword, setLoginPassword, "Password", "password", false, login)}
              </div>
              {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
              <button onClick={login} disabled={loading || !loginName.trim() || !loginPassword}
                className="w-full py-2.5 rounded-md text-sm font-medium disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#000" }}>
                {loading ? "..." : "Sign In"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Invite code</label>
                {inp(inviteCode, setInviteCode, "12-character code", "text", true)}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Your name</label>
                {inp(regName, setRegName, "e.g. Sophie")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Assistant name</label>
                {inp(assistantName, setAssistantName, "e.g. Gulli, Aria")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>City <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                {inp(city, setCity, "e.g. Paris")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                {inp(regPassword, setRegPassword, "Min 4 characters", "password")}
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm</label>
                {inp(regConfirm, setRegConfirm, "Repeat password", "password", false, register)}
              </div>
              {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
              <button onClick={register} disabled={loading}
                className="w-full py-2.5 rounded-md text-sm font-medium disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#000" }}>
                {loading ? "..." : "Join"}
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: "var(--border)" }}>
            {mode === "login" ? (
              <button onClick={() => { setMode("register"); setError(""); }}
                className="text-xs" style={{ color: "var(--text-muted)" }}>
                Have an invite code? <span style={{ color: "var(--accent)" }}>Join the family</span>
              </button>
            ) : (
              <button onClick={() => { setMode("login"); setError(""); }}
                className="text-xs" style={{ color: "var(--text-muted)" }}>
                Already have an account? <span style={{ color: "var(--accent)" }}>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
