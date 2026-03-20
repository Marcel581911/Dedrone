import { Globe } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-white">
            FIFA World Cup 2026
          </h1>
          <p className="text-xs text-slate-400">
            Dedrone Deployment &amp; Deal Dashboard
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-slate-500">United States &bull; Canada</div>
          <div className="text-xs font-medium text-blue-400">12 Host Venues</div>
        </div>
      </div>
    </header>
  );
}
