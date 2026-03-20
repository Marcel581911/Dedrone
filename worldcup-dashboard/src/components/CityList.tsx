import type { HostCity } from '../types';
import { MapPin, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface CityListProps {
  cities: HostCity[];
  selectedCity: HostCity | null;
  onCitySelect: (city: HostCity) => void;
}

function getCityStatusInfo(city: HostCity) {
  const allDelivered = city.equipment.every(e => e.delivered === 'delivered');
  const hasOpenDeals = city.equipment.some(e => e.dealStatus === 'open');
  const totalUnits = city.equipment.reduce((sum, e) => sum + e.quantity, 0);
  const deliveredUnits = city.equipment.filter(e => e.delivered === 'delivered').reduce((sum, e) => sum + e.quantity, 0);

  if (allDelivered) return { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, text: 'All delivered', color: 'text-emerald-400' };
  if (hasOpenDeals) return { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, text: `${deliveredUnits}/${totalUnits} delivered`, color: 'text-amber-400' };
  return { icon: <Clock className="h-3.5 w-3.5 text-blue-400" />, text: `${deliveredUnits}/${totalUnits} delivered`, color: 'text-blue-400' };
}

export default function CityList({ cities, selectedCity, onCitySelect }: CityListProps) {
  return (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Host Cities ({cities.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {cities.map(city => {
          const status = getCityStatusInfo(city);
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
                  {city.country === 'CA' && (
                    <span className="rounded bg-red-900/40 px-1 py-0.5 text-[9px] font-bold text-red-300">CA</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{city.venue}</div>
                <div className={`mt-0.5 flex items-center gap-1 text-xs ${status.color}`}>
                  {status.icon}
                  <span>{status.text}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
