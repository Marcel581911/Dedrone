import type { HostCity, FederalPoolAsset } from '../types';
import { BarChart3, CheckCircle2, Truck, AlertCircle, Users, MapPin } from 'lucide-react';

interface DealSummaryBarProps {
  cities: HostCity[];
  federalPool: FederalPoolAsset[];
}

export default function DealSummaryBar({ cities, federalPool }: DealSummaryBarProps) {
  const allEquipment = cities.flatMap(c => c.equipment);
  const allPeople = cities.flatMap(c => c.supportTeam);

  const cityEquipUnits = allEquipment.reduce((sum, e) => sum + e.quantity, 0);
  const fedUnits = federalPool.reduce((sum, a) => sum + a.quantity, 0);
  const totalUnits = cityEquipUnits + fedUnits;

  const deliveredUnits = allEquipment.filter(e => e.delivered === 'delivered').reduce((sum, e) => sum + e.quantity, 0)
    + federalPool.filter(a => a.delivered === 'delivered').reduce((sum, a) => sum + a.quantity, 0);
  const inTransitUnits = allEquipment.filter(e => e.delivered === 'in-transit').reduce((sum, e) => sum + e.quantity, 0)
    + federalPool.filter(a => a.delivered === 'in-transit').reduce((sum, a) => sum + a.quantity, 0);
  const pendingUnits = totalUnits - deliveredUnits - inTransitUnits;

  const allDealItems = [...allEquipment, ...federalPool];
  const closedDeals = allDealItems.filter(e => e.dealStatus === 'closed').length;
  const openDeals = allDealItems.filter(e => e.dealStatus === 'open').length;
  const readyCount = allDealItems.filter(e => e.deliveryReady === 'yes').length;

  const citiesWithEquipment = cities.filter(c => c.equipment.length > 0).length;

  const onSiteTotal = allPeople.filter(p => p.supportType === 'on-site').length;
  const virtualTotal = allPeople.filter(p => p.supportType === 'virtual').length;

  const deliveryPct = totalUnits > 0 ? Math.round((deliveredUnits / totalUnits) * 100) : 0;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900/80 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5">
        <BarChart3 className="h-4 w-4 text-blue-400" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Overall Delivery</div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-slate-700">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
                style={{ width: `${deliveryPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white">{deliveryPct}%</span>
          </div>
        </div>
      </div>

      <Divider />

      <StatBlock icon={<MapPin className="h-3.5 w-3.5 text-cyan-400" />} label="Cities Active" value={`${citiesWithEquipment}/${cities.length}`} />
      <StatBlock icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />} label="Deals Closed" value={`${closedDeals}`} sub={`${openDeals} open`} />
      <StatBlock icon={<Truck className="h-3.5 w-3.5 text-blue-400" />} label="HW Units" value={`${totalUnits}`} sub={`${deliveredUnits} del / ${inTransitUnits} transit / ${pendingUnits} pending`} />
      <StatBlock icon={<AlertCircle className="h-3.5 w-3.5 text-amber-400" />} label="Delivery Ready" value={`${readyCount}/${allDealItems.length}`} />
      {(onSiteTotal + virtualTotal > 0) && (
        <StatBlock icon={<Users className="h-3.5 w-3.5 text-purple-400" />} label="Support Staff" value={`${onSiteTotal + virtualTotal}`} sub={`${onSiteTotal} site / ${virtualTotal} virtual`} />
      )}

      <div className="ml-auto flex items-center gap-3 text-[10px]">
        <Legend color="bg-emerald-500" label="All Delivered" />
        <Legend color="bg-blue-500" label="In Progress" />
        <Legend color="bg-red-500" label="Open Deals" />
        <Legend color="bg-slate-500" label="No Data" />
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
      {icon}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-white">{value}</span>
          {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-1 h-8 w-px bg-slate-700" />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-slate-400">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
