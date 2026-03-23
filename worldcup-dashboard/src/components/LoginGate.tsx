import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';

interface LoginGateProps {
  onAuthenticated: () => void;
}

const PASS_HASH = '1c19c2dcb7ced19303a6754bb6cf3b9da2ad02fff8950bbab90cd105c7bc90af';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function LoginGate({ onAuthenticated }: LoginGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const hash = await sha256(password);
    if (hash === PASS_HASH) {
      sessionStorage.setItem('wc-auth', 'true');
      onAuthenticated();
    } else {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">FIFA World Cup 2026</h1>
          <p className="text-sm text-slate-400">Dedrone Deal Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="Enter password"
                autoFocus
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-400">Incorrect password. Please try again.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] text-slate-600">
          Authorized personnel only — Dedrone internal use
        </p>
      </div>
    </div>
  );
}
