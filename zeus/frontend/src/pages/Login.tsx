import { useState } from "react";
import { api } from "../api";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      await api.login(password);
      onLogin();
    } catch (e: any) {
      setError(e.message === "not_authenticated" ? "Invalid password." : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">⚡ ZEUS</h1>
          <p className="text-gray-500">Agent Runtime</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-lg font-bold mb-6 text-center">Sign In</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Enter your password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-amber-600 outline-none"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          <button
            onClick={submit}
            disabled={loading || !password}
            className="w-full mt-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
