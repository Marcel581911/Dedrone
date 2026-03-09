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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessUrl, setAccessUrl] = useState("");

  const next = () => {
    setError("");
    if (step === 1) {
      if (!vmAddress.trim()) {
        setError("Enter your VM's IP address or hostname.");
        return;
      }
      setStep(2);
    }
  };

  const finish = async () => {
    setError("");
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const addr = vmAddress.trim().replace(/\/+$/, "");
      await api.onboard(password, addr);
      const url = `http://${addr}:3000`;
      setAccessUrl(url);
      setStep(3);
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
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-600"
              }`}>
                {step > s ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-amber-600" : "bg-gray-800"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold mb-2">Network Address</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the IP address or hostname of this VM. This is how you'll access ZEUS from other devices on the network.
              </p>
              <label className="block text-sm text-gray-400 mb-2">VM IP Address</label>
              <input
                value={vmAddress}
                onChange={(e) => setVmAddress(e.target.value)}
                placeholder="e.g. 192.168.1.100 or myvm.local"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none mb-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
              <p className="text-xs text-gray-600 mb-6">
                Tip: run <code className="bg-gray-800 px-1.5 py-0.5 rounded">hostname -I</code> on the VM to find it.
              </p>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={next}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium"
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold mb-2">Set Access Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose a password to protect the ZEUS dashboard. You'll need this to log in from any device.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none"
                    onKeyDown={(e) => e.key === "Enter" && finish()}
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={finish}
                  disabled={saving}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Setting up..." : "Complete Setup"}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h2 className="text-xl font-bold mb-2 text-green-400">ZEUS is Ready!</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Your agent runtime is set up and protected. Access it from any device on your network.
                </p>

                <div className="bg-gray-800 border border-amber-800 rounded-lg p-5 mb-6">
                  <p className="text-xs text-gray-500 mb-2">Access URL (bookmark this):</p>
                  <a
                    href={accessUrl}
                    className="text-lg font-mono text-amber-400 hover:text-amber-300 underline break-all"
                  >
                    {accessUrl}
                  </a>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 text-left text-sm text-gray-400 mb-6">
                  <p className="font-medium text-gray-300 mb-2">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <strong>Settings</strong> and enter your OpenAI API key</li>
                    <li>Open the <strong>Orchestrator</strong> agent and start chatting</li>
                    <li>The Orchestrator will create tickets and delegate to the Research Agent</li>
                  </ol>
                </div>

                <button
                  onClick={onComplete}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium"
                >
                  Enter ZEUS Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
