import type { Equipment, HostCity } from '../types';
import AgencyCard from './AgencyCard';
import SupportTeamList from './SupportTeamList';
import EquipmentModal from './EquipmentModal';
import NearbySensorsModal from './NearbySensorsModal';
import { nearbySensors } from '../data/nearbySensors';
import { MapPin, X, Users, Building, Package, Radio } from 'lucide-react';
import { useState } from 'react';

interface CityDetailPanelProps {
  city: HostCity;
  onClose: () => void;
}

interface AgencyGroup {
  name: string;
  ownership: Equipment['ownership'];
  equipment: Equipment[];
}

function groupByAgency(equipment: Equipment[]): AgencyGroup[] {
  const map = new Map<string, AgencyGroup>();
  for (const item of equipment) {
    const existing = map.get(item.ownerName);
    if (existing) {
      existing.equipment.push(item);
    } else {
      map.set(item.ownerName, {
        name: item.ownerName,
        ownership: item.ownership,
        equipment: [item],
      });
    }
  }
  return Array.from(map.values());
}

function consolidateEquipment(equipment: Equipment[]): { name: string; qty: number }[] {
  const map = new Map<string, number>();
  for (const item of equipment) {
    map.set(item.name, (map.get(item.name) || 0) + item.quantity);
  }
  return Array.from(map.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);
}

function countryLabel(city: HostCity) {
  switch (city.country) {
    case 'US': return `${city.state}, USA`;
    case 'CA': return `🇨🇦 ${city.state}, Canada`;
    case 'MX': return `🇲🇽 ${city.state}, Mexico`;
  }
}

export default function CityDetailPanel({ city, onClose }: CityDetailPanelProps) {
  const [modalAgency, setModalAgency] = useState<AgencyGroup | null>(null);
  const [showSensors, setShowSensors] = useState(false);

  const sensorData = nearbySensors[city.id];

  const hasEquipment = city.equipment.length > 0;
  const hasSupportTeam = city.supportTeam.length > 0;

  const agencies = groupByAgency(city.equipment);
  const onSiteCount = city.supportTeam.filter(p => p.supportType === 'on-site').length;
  const virtualCount = city.supportTeam.filter(p => p.supportType === 'virtual').length;

  const consolidatedHW = consolidateEquipment(city.equipment);

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden border-l border-slate-700 bg-slate-900">
        {/* Header */}
        <div className="relative border-b border-slate-700 bg-gradient-to-r from-blue-950 to-slate-900 px-5 py-4">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-blue-400">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {countryLabel(city)}
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">{city.city}</h2>
          <p className="text-sm text-slate-300">{city.venue}</p>

          {/* Hardware bubbles */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hardware</span>
            </div>
            {hasEquipment ? (
              <div className="flex flex-wrap gap-1.5">
                {consolidatedHW.map(item => (
                  <span
                    key={item.name}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-[11px]"
                  >
                    <span className="font-bold text-blue-300">{item.qty}</span>
                    <span className="text-slate-300">{item.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-500">-</span>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Agencies section */}
          <div className="border-b border-slate-800 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Agencies</span>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                {hasEquipment ? agencies.length : '-'}
              </span>
            </div>
            {hasEquipment ? (
              <div className="space-y-3">
                {agencies.map(agency => (
                  <AgencyCard
                    key={agency.name}
                    agencyName={agency.name}
                    ownershipType={agency.ownership}
                    equipment={agency.equipment}
                    onClick={() => setModalAgency(agency)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center">
                <div className="text-sm text-slate-500">-</div>
                <div className="mt-1 text-xs text-slate-600">No agency deals in pipeline yet</div>
              </div>
            )}
          </div>

          {/* Existing sensors section */}
          {sensorData && sensorData.total > 0 && (
            <div className="border-b border-slate-800 px-4 py-4">
              <button
                onClick={() => setShowSensors(true)}
                className="w-full rounded-lg border border-purple-800/50 bg-purple-950/20 p-3 text-left transition-all hover:bg-purple-950/40 hover:border-purple-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-300">Existing Sensors Nearby</span>
                  </div>
                  <span className="rounded-full bg-purple-900/50 border border-purple-700 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                    {sensorData.total}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-purple-400/70">
                  {sensorData.tenants.length} deployments within 50 mi — click for details
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(sensorData.typeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([type, count]) => (
                      <span key={type} className="rounded-full bg-purple-900/30 px-2 py-0.5 text-[10px] text-purple-300">
                        {count} {type}
                      </span>
                    ))}
                </div>
              </button>
            </div>
          )}

          {/* Support team section */}
          <div className="border-b border-slate-800 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Support Team</span>
              {hasSupportTeam ? (
                <>
                  <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-[10px] text-blue-300">
                    {onSiteCount} on-site
                  </span>
                  <span className="rounded-full bg-purple-900/50 px-2 py-0.5 text-[10px] text-purple-300">
                    {virtualCount} virtual
                  </span>
                </>
              ) : (
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">-</span>
              )}
            </div>
            {hasSupportTeam ? (
              <SupportTeamList team={city.supportTeam} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center">
                <div className="text-sm text-slate-500">-</div>
                <div className="mt-1 text-xs text-slate-600">No support team assigned yet</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Equipment popup modal */}
      {modalAgency && (
        <EquipmentModal
          agencyName={modalAgency.name}
          equipment={modalAgency.equipment}
          onClose={() => setModalAgency(null)}
        />
      )}

      {/* Nearby sensors modal */}
      {showSensors && sensorData && (
        <NearbySensorsModal
          cityName={city.city}
          data={sensorData}
          onClose={() => setShowSensors(false)}
        />
      )}
    </>
  );
}
