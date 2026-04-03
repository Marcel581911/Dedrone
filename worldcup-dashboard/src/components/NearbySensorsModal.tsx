import type { NearbySensorSummary } from '../data/nearbySensors';
import { X, Radio, Building2, MapPin, CircleDot, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NearbySensorsModalProps {
  cityName: string;
  data: NearbySensorSummary;
  onClose: () => void;
}

type ViewMode = 'summary' | 'tenants' | 'sensors';

export default function NearbySensorsModal({ cityName, data, onClose }: NearbySensorsModalProps) {
  const [view, setView] = useState<ViewMode>('summary');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filteredSensors = data.sensors.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.label.toLowerCase().includes(q) ||
      s.tenant.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      s.sensorId.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-900/60">
              <Radio className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Existing Sensors — {cityName}</h3>
              <p className="text-xs text-slate-400">{data.total} sensors within 50 miles of stadium &middot; {data.tenants.length} deployments</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {(['summary', 'tenants', 'sensors'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                view === mode
                  ? 'border-b-2 border-purple-400 text-purple-300 bg-purple-950/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {mode === 'summary' ? 'Overview' : mode === 'tenants' ? `Deployments (${data.tenants.length})` : `All Sensors (${data.total})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {view === 'summary' && <SummaryView data={data} />}
          {view === 'tenants' && <TenantsView data={data} />}
          {view === 'sensors' && (
            <div>
              <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search sensors..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <SensorsView sensors={filteredSensors} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryView({ data }: { data: NearbySensorSummary }) {
  const sortedTypes = Object.entries(data.typeCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1;

  return (
    <div className="p-5 space-y-5">
      {/* Sensor type breakdown */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Sensor Types</h4>
        <div className="space-y-2">
          {sortedTypes.map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <span className="w-28 text-xs text-slate-300 text-right">{type}</span>
              <div className="flex-1 h-5 rounded bg-slate-800">
                <div
                  className="h-5 rounded bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((count / maxCount) * 100, 8)}%` }}
                >
                  <span className="text-[10px] font-bold text-white">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top deployments */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Top Deployments (by sensor count)
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.tenants.slice(0, 10).map(t => (
            <span key={t.name} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-white">{t.name}</span>
              <span className="rounded-full bg-purple-900/50 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">{t.sensorCount}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TenantsView({ data }: { data: NearbySensorSummary }) {
  return (
    <div className="p-4 space-y-2">
      {data.tenants.map(t => (
        <div key={t.name} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">{t.name}</span>
            </div>
            <span className="rounded-full bg-purple-900/50 px-2 py-0.5 text-xs font-bold text-purple-300">
              {t.sensorCount} sensors
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {t.types.map(type => (
              <span key={type} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                {type}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SensorsView({ sensors }: { sensors: NearbySensorSummary['sensors'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2">Sensor</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Deployment</th>
            <th className="px-3 py-2">Distance</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {sensors.map((s, i) => (
            <tr key={`${s.sensorId}-${i}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <CircleDot className={`h-3 w-3 ${s.isActive ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className="text-slate-300 font-mono text-[10px]">{s.label || s.sensorId}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-300">{s.type}</span>
              </td>
              <td className="px-3 py-2 text-slate-400">{s.tenant}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1 text-slate-400">
                  <MapPin className="h-3 w-3" />
                  <span>{s.distanceMiles} mi</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  s.isActive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
