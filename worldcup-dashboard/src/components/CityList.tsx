import type { HostCity } from '../types';
import { MapPin, CheckCircle2, AlertTriangle, Clock, CircleDashed } from 'lucide-react';

interface CityListProps {
  cities: HostCity[];
  selectedCity: HostCity | null;
  onCitySelect: (city: HostCity) => void;
}

function getCityStatusInfo(city: HostCity) {
  if (city.equipment.length === 0) {
    return { icon: <CircleDashed className="h-3.5 w-3.5 text-slate-500" />, text: '-', color: 'text-slate-500' };
  }
  const totalUnits = city.equipment.reduce((sum, e) => sum + e.quantity, 0);
  const deliveredUnits = city.equipment.filter(e => e.delivered === 'delivered').reduce((sum, e) => sum + e.quantity, 0);
  const allDelivered = city.equipment.every(e => e.delivered === 'delivered');
  const hasOpenDeals = city.equipment.some(e => e.dealStatus === 'open');

  if (allDelivered) return { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, text: 'All delivered', color: 'text-emerald-400' };
  if (hasOpenDeals) return { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, text: `${deliveredUnits}/${totalUnits} units delivered`, color: 'text-amber-400' };
  return { icon: <Clock className="h-3.5 w-3.5 text-blue-400" />, text: `${deliveredUnits}/${totalUnits} units delivered`, color: 'text-blue-400' };
}

function getUniqueOwners(city: HostCity): string[] {
  const owners = new Set(city.equipment.map(e => e.ownerName));
  return Array.from(owners);
}

function getTopEquipment(city: HostCity): { name: string; qty: number }[] {
  const map = new Map<string, number>();
  for (const item of city.equipment) {
    map.set(item.name, (map.get(item.name) || 0) + item.quantity);
  }
  return Array.from(map.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);
}

export default function CityList({ cities, selectedCity, onCitySelect }: CityListProps) {
  const citiesWithData = cities.filter(c => c.equipment.length > 0);
  const citiesWithoutData = cities.filter(c => c.equipment.length === 0);

  return (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Host Cities ({cities.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {citiesWithData.map(city => {
          const status = getCityStatusInfo(city);
          const owners = getUniqueOwners(city);
          const topHW = getTopEquipment(city);
          const totalTypes = new Set(city.equipment.map(e => e.name)).size;
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
                <div className="text-[10px] text-slate-600 truncate">{owners.join(' · ')}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {topHW.map(item => (
                    <span key={item.name} className="inline-flex items-center gap-0.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px]">
                      <span className="font-bold text-blue-300">{item.qty}</span>
                      <span className="text-slate-400">{item.name}</span>
                    </span>
                  ))}
                  {totalTypes > 4 && (
                    <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">
                      +{totalTypes - 4}
                    </span>
                  )}
                </div>
                <div className={`mt-0.5 flex items-center gap-1 text-xs ${status.color}`}>
                  {status.icon}
                  <span>{status.text}</span>
                </div>
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
