import type { HostCity } from '../types';
import EquipmentTable from './EquipmentTable';
import SupportTeamList from './SupportTeamList';
import { MapPin, X, Package, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CityDetailPanelProps {
  city: HostCity;
  onClose: () => void;
}

export default function CityDetailPanel({ city, onClose }: CityDetailPanelProps) {
  const [equipmentOpen, setEquipmentOpen] = useState(true);
  const [supportOpen, setSupportOpen] = useState(true);

  const totalEquipment = city.equipment.reduce((sum, e) => sum + e.quantity, 0);
  const deliveredCount = city.equipment.filter(e => e.delivered === 'delivered').reduce((sum, e) => sum + e.quantity, 0);
  const closedDeals = city.equipment.filter(e => e.dealStatus === 'closed').length;
  const onSiteCount = city.supportTeam.filter(p => p.supportType === 'on-site').length;
  const virtualCount = city.supportTeam.filter(p => p.supportType === 'virtual').length;

  return (
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
            {city.country === 'US' ? `${city.state}, USA` : `${city.state}, Canada`}
          </span>
        </div>
        <h2 className="mt-1 text-xl font-bold text-white">{city.city}</h2>
        <p className="text-sm text-slate-300">{city.venue}</p>

        {/* Quick stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
            <div className="text-lg font-bold text-white">{totalEquipment}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Units</div>
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
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Equipment section */}
        <div className="border-b border-slate-800">
          <button
            onClick={() => setEquipmentOpen(!equipmentOpen)}
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Equipment Deployed</span>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                {city.equipment.length}
              </span>
            </div>
            {equipmentOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {equipmentOpen && (
            <div className="px-2 pb-3">
              <EquipmentTable equipment={city.equipment} />
            </div>
          )}
        </div>

        {/* Support team section */}
        <div className="border-b border-slate-800">
          <button
            onClick={() => setSupportOpen(!supportOpen)}
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Support Team</span>
              <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-[10px] text-blue-300">
                {onSiteCount} on-site
              </span>
              <span className="rounded-full bg-purple-900/50 px-2 py-0.5 text-[10px] text-purple-300">
                {virtualCount} virtual
              </span>
            </div>
            {supportOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {supportOpen && (
            <div className="px-4 pb-4">
              <SupportTeamList team={city.supportTeam} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
