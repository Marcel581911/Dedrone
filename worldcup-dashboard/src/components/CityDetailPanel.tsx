import type { Equipment, HostCity } from '../types';
import AgencyCard from './AgencyCard';
import SupportTeamList from './SupportTeamList';
import EquipmentModal from './EquipmentModal';
import { MapPin, X, Users, CircleDashed, Building } from 'lucide-react';
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

function countryLabel(city: HostCity) {
  switch (city.country) {
    case 'US': return `${city.state}, USA`;
    case 'CA': return `${city.state}, Canada`;
    case 'MX': return `${city.state}, Mexico`;
  }
}

export default function CityDetailPanel({ city, onClose }: CityDetailPanelProps) {
  const [modalAgency, setModalAgency] = useState<AgencyGroup | null>(null);

  const hasEquipment = city.equipment.length > 0;
  const hasSupportTeam = city.supportTeam.length > 0;

  const agencies = groupByAgency(city.equipment);
  const totalEquipment = city.equipment.reduce((sum, e) => sum + e.quantity, 0);
  const deliveredCount = city.equipment.filter(e => e.delivered === 'delivered').reduce((sum, e) => sum + e.quantity, 0);
  const closedDeals = city.equipment.filter(e => e.dealStatus === 'closed').length;
  const onSiteCount = city.supportTeam.filter(p => p.supportType === 'on-site').length;
  const virtualCount = city.supportTeam.filter(p => p.supportType === 'virtual').length;

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

          {hasEquipment ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
                <div className="text-lg font-bold text-white">{totalEquipment}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">HW Units</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
                <div className="text-lg font-bold text-emerald-400">{deliveredCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Delivered</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
                <div className="text-lg font-bold text-blue-400">{closedDeals}/{city.equipment.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Deals Closed</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
              <CircleDashed className="h-5 w-5 text-slate-500" />
              <div>
                <div className="text-sm font-medium text-slate-300">No deals in pipeline</div>
                <div className="text-xs text-slate-500">Equipment data will appear here once Salesforce opportunities are created for this venue.</div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Agencies section */}
          {hasEquipment && (
            <div className="border-b border-slate-800 px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Agencies</span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                  {agencies.length}
                </span>
              </div>
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
            </div>
          )}

          {/* Support team section */}
          {hasSupportTeam && (
            <div className="border-b border-slate-800 px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Support Team</span>
                <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-[10px] text-blue-300">
                  {onSiteCount} on-site
                </span>
                <span className="rounded-full bg-purple-900/50 px-2 py-0.5 text-[10px] text-purple-300">
                  {virtualCount} virtual
                </span>
              </div>
              <SupportTeamList team={city.supportTeam} />
            </div>
          )}

          {!hasSupportTeam && hasEquipment && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="h-4 w-4" />
                <span className="text-sm">No support team assigned yet</span>
              </div>
            </div>
          )}
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
    </>
  );
}
