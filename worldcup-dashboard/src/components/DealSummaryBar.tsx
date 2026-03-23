import type { HostCity, FederalPoolAsset } from '../types';
import { BarChart3, Truck, Users, MapPin, Building } from 'lucide-react';

interface DealSummaryBarProps {
  cities: HostCity[];
  federalPool: FederalPoolAsset[];
}

function stepScore(value: string): number {
  const v = value.toLowerCase();
  if (v === 'yes' || v === 'delivered' || v === 'shipped') return 1;
  if (v === 'order submitted' || v === 'partially shipped' || v === 'shipping in april' || v === 'shipment pending' || v === 'pending') return 0.5;
  if (v === 'n/a') return 1;
  return 0;
}

export default function DealSummaryBar({ cities, federalPool }: DealSummaryBarProps) {
  const allTrackers = cities.flatMap(c => c.tracker);
  const allPeople = cities.flatMap(c => c.supportTeam);
  const fedUnits = federalPool.reduce((sum, a) => sum + a.quantity, 0);

  const citiesWithActivity = cities.filter(c => c.equipment.length > 0 || c.tracker.length > 0).length;
  const totalAccounts = allTrackers.length;

  let totalSteps = 0;
  let completedSteps = 0;
  for (const t of allTrackers) {
    const steps = [t.dealClosedWon, t.poReceived, t.waiverReceived, t.fbiTraining, t.readyForDelivery, t.shipmentStatus];
    const applicable = steps.filter(s => s.toLowerCase() !== 'n/a' && s !== '-' && s !== '');
    totalSteps += applicable.length;
    completedSteps += applicable.reduce((sum, s) => sum + stepScore(s), 0);
  }

  const deliveryPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const shippedAccounts = allTrackers.filter(t => {
    const s = t.shipmentStatus.toLowerCase();
    return s.includes('shipped') || s.includes('shipping');
  }).length;
  const readyAccounts = allTrackers.filter(t => {
    const v = t.readyForDelivery.toLowerCase();
    return v === 'yes' || v === 'pending';
  }).length;

  const onSiteTotal = allPeople.filter(p => p.supportType === 'on-site').length;
  const virtualTotal = allPeople.filter(p => p.supportType === 'virtual').length;

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

      <StatBlock icon={<MapPin className="h-3.5 w-3.5 text-cyan-400" />} label="Cities Active" value={`${citiesWithActivity}/${cities.length}`} />
      <StatBlock icon={<Building className="h-3.5 w-3.5 text-amber-400" />} label="Accounts" value={`${totalAccounts}`} sub={`${shippedAccounts} shipping / ${readyAccounts} ready`} />
      <StatBlock icon={<Truck className="h-3.5 w-3.5 text-blue-400" />} label="Federal Pool" value={`${fedUnits}`} sub="DHS S&T" />
      {(onSiteTotal + virtualTotal > 0) && (
        <StatBlock icon={<Users className="h-3.5 w-3.5 text-purple-400" />} label="Support Staff" value={`${onSiteTotal + virtualTotal}`} sub={`${onSiteTotal} site / ${virtualTotal} virtual`} />
      )}

      <div className="ml-auto flex items-center gap-3 text-[10px]">
        <Legend color="bg-emerald-500" label="Shipping" />
        <Legend color="bg-blue-500" label="In Progress" />
        <Legend color="bg-amber-500" label="Pipeline" />
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
