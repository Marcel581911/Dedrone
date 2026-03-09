import { useState } from "react";
import { api } from "../api";

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [vmAddress, setVmAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [assistantName, setAssistantName] = useState("Zeus");
  const [assistantPersonality, setAssistantPersonality] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessUrl, setAccessUrl] = useState("");

  const TOTAL_STEPS = 4;

  const validate = () => {
    setError("");
    if (step === 1) {
      if (!userName.trim()) { setError("Enter your name or nickname."); return false; }
      return true;
    }
    if (step === 2) {
      if (!vmAddress.trim()) { setError("Enter your VM's IP address."); return false; }
      return true;
    }
    if (step === 3) {
      if (password.length < 4) { setError("Password must be at least 4 characters."); return false; }
      if (password !== confirmPassword) { setError("Passwords don't match."); return false; }
      return true;
    }
    return true;
  };

  const next = () => { if (validate()) setStep(step + 1); };

  const finish = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const addr = vmAddress.trim().replace(/\/+$/, "");
      await api.onboard(password, addr, userName.trim(), assistantName.trim() || "Zeus", assistantPersonality.trim());
      setAccessUrl(`http://${addr}:3000`);
      setStep(TOTAL_STEPS + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">⚡ ZEUS</h1>
          <p className="text-gray-500">Agent Runtime — First-time Setup</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-600"
              }`}>
                {step > s ? "✓" : s}
              </div>
              {s < TOTAL_STEPS && <div className={`w-8 h-0.5 ${step > s ? "bg-amber-600" : "bg-gray-800"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold mb-2">Welcome</h2>
              <p className="text-sm text-gray-500 mb-6">
                Let's personalize your experience. What should we call you?
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Your Name or Nickname</label>
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Marcel"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && next()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name your Assistant</label>
                  <input
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    placeholder="e.g. Zeus, Jarvis, Ada..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Personality & Attitude <span className="text-gray-600">(optional)</span>
                  </label>
                  <textarea
                    value={assistantPersonality}
                    onChange={(e) => setAssistantPersonality(e.target.value)}
                    placeholder="e.g. Professional but friendly, speaks concisely, occasionally uses humor. Proactive — suggests improvements without being asked."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none min-h-[90px]"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <button onClick={next} className="w-full mt-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold mb-2">Network Address</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the IP address of this VM so you can access ZEUS from other devices.
              </p>
              <label className="block text-sm text-gray-400 mb-2">VM IP Address</label>
              <input
                value={vmAddress}
                onChange={(e) => setVmAddress(e.target.value)}
                placeholder="e.g. 192.168.1.100"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none mb-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
              <p className="text-xs text-gray-600 mb-6">
                Run <code className="bg-gray-800 px-1.5 py-0.5 rounded">hostname -I</code> on the VM to find it.
              </p>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(""); }} className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Back</button>
                <button onClick={next} className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">Next</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold mb-2">Set Access Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                This protects your dashboard from unauthorized access.
              </p>
              <div className="space-y-4">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password" autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none" />
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setStep(2); setError(""); }} className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Back</button>
                <button onClick={next} className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">Next</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-bold mb-2">Review & Launch</h2>
              <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-gray-500">Your name:</span><span>{userName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Assistant:</span><span>{assistantName || "Zeus"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">VM address:</span><span>{vmAddress}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Password:</span><span>{"•".repeat(password.length)}</span></div>
                {assistantPersonality && (
                  <div><span className="text-gray-500">Personality:</span><p className="text-gray-300 mt-1 text-xs">{assistantPersonality}</p></div>
                )}
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setStep(3); setError(""); }} className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Back</button>
                <button onClick={finish} disabled={saving}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? "Setting up..." : "Launch ZEUS"}
                </button>
              </div>
            </>
          )}

          {step === TOTAL_STEPS + 1 && (
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-xl font-bold mb-2 text-green-400">
                {assistantName || "Zeus"} is ready, {userName}!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your personal AI assistant is set up and waiting for instructions.
              </p>
              <div className="bg-gray-800 border border-amber-800 rounded-lg p-5 mb-6">
                <p className="text-xs text-gray-500 mb-2">Access from any device:</p>
                <a href={accessUrl} className="text-lg font-mono text-amber-400 hover:text-amber-300 underline break-all">{accessUrl}</a>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-left text-sm text-gray-400 mb-6">
                <p className="font-medium text-gray-300 mb-2">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <strong>Settings</strong> → enter your <strong>OpenAI API key</strong></li>
                  <li>Chat with <strong>{assistantName || "Zeus"}</strong> — give it a task</li>
                  <li>Set up <strong>Automations</strong> for recurring work</li>
                  <li>Optionally configure <strong>Email</strong> and <strong>Telegram</strong></li>
                </ol>
              </div>
              <button onClick={onComplete} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">
                Enter Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
