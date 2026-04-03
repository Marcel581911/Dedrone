import type { HostCity } from '../types';
import { MapPin } from 'lucide-react';

interface CityListProps {
  cities: HostCity[];
  selectedCity: HostCity | null;
  onCitySelect: (city: HostCity) => void;
}

function isStepPassed(value: string): boolean {
  const v = value.toLowerCase();
  return v === 'yes' || v === 'order submitted' || v === 'partially shipped' ||
    v === 'shipping in april' || v === 'shipment pending' || v === 'shipped' ||
    v === 'in progress' || v === 'pending';
}

function getTrackerSummary(city: HostCity) {
  if (city.tracker.length === 0) return null;
  const activeTrackers = city.tracker.filter(t => t.dealClosedWon !== '-' && t.dealClosedWon !== '');
  if (activeTrackers.length === 0) return null;
  const steps = ['dealClosedWon', 'poReceived', 'readyForDelivery', 'shipmentStatus'] as const;
  const stepLabels = ['Deal', 'PO', 'Ready', 'Shipped'];
  const results = steps.map(step => {
    const passed = activeTrackers.filter(t => isStepPassed(t[step])).length;
    return { passed, total: activeTrackers.length };
  });
  return { stepLabels, results, total: activeTrackers.length };
}

function getUniqueOwners(city: HostCity): string[] {
  const owners = new Set(city.equipment.map(e => e.ownerName));
  return Array.from(owners);
}


export default function CityList({ cities, selectedCity, onCitySelect }: CityListProps) {
  const citiesWithData = cities.filter(c => c.equipment.length > 0 || c.tracker.length > 0);
  const citiesWithoutData = cities.filter(c => c.equipment.length === 0 && c.tracker.length === 0);

  return (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Host Cities ({cities.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {citiesWithData.map(city => {
          const owners = getUniqueOwners(city);
          const trackerAccounts = city.tracker.map(t => t.account);
          const allAccounts = [...new Set([...owners, ...trackerAccounts])];
          const trackerSummary = getTrackerSummary(city);
          const isSelected = selectedCity?.id === city.id;
          return (
            <button
              key={city.id}
              onClick={() => onCitySelect(city)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-800/50 ${
                isSelected
                  ? 'bg-blue-950/50 border-l-2 border-l-blue-500'
                  : 'hover:bg-slate-900 border-l-2 border-l-transparent'
              }`}
            >
              <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {city.city}
                  </span>
                  {city.country === 'CA' && <span className="text-sm" title="Canada">🇨🇦</span>}
                  {city.country === 'MX' && <span className="text-sm" title="Mexico">🇲🇽</span>}
                </div>
                <div className="text-xs text-slate-500">{city.venue}</div>
                <div className="text-[10px] text-slate-600 truncate">{allAccounts.join(' · ')}</div>

                {/* Tracker step progress */}
                {trackerSummary && (
                  <div className="mt-1.5 flex items-center gap-1">
                    {trackerSummary.stepLabels.map((label, i) => {
                      const r = trackerSummary.results[i];
                      const pct = r.total > 0 ? r.passed / r.total : 0;
                      const color = pct === 1 ? 'bg-emerald-400' : pct > 0 ? 'bg-amber-400' : 'bg-slate-700';
                      return (
                        <div key={label} className="flex flex-col items-center gap-0.5" title={`${label}: ${r.passed}/${r.total}`}>
                          <div className={`h-1.5 w-8 rounded-full ${color}`} />
                          <span className="text-[8px] text-slate-500">{label}</span>
                        </div>
                      );
                    })}
                    <span className="ml-1 text-[9px] text-slate-500">{trackerSummary.total} accts</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {citiesWithoutData.length > 0 && (
          <>
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Awaiting Deals ({citiesWithoutData.length})
              </span>
            </div>
            {citiesWithoutData.map(city => {
              const isSelected = selectedCity?.id === city.id;
              return (
                <button
                  key={city.id}
                  onClick={() => onCitySelect(city)}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-800/50 opacity-60 ${
                    isSelected
                      ? 'bg-blue-950/30 border-l-2 border-l-blue-500 opacity-100'
                      : 'hover:bg-slate-900 border-l-2 border-l-transparent'
                  }`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-slate-400">{city.city}</span>
                      {city.country === 'CA' && <span className="text-sm" title="Canada">🇨🇦</span>}
                      {city.country === 'MX' && <span className="text-sm" title="Mexico">🇲🇽</span>}
                    </div>
                    <div className="text-xs text-slate-600">{city.venue}</div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
