import type { Equipment } from '../types';
import { Shield, Building2, Landmark, Package, ChevronRight } from 'lucide-react';

interface AgencyCardProps {
  agencyName: string;
  ownershipType: Equipment['ownership'];
  equipment: Equipment[];
  onClick: () => void;
}

function ownershipIcon(type: Equipment['ownership']) {
  switch (type) {
    case 'Federal': return <Landmark className="h-5 w-5 text-blue-400" />;
    case 'SLTT': return <Shield className="h-5 w-5 text-amber-400" />;
    case 'Private': return <Building2 className="h-5 w-5 text-emerald-400" />;
  }
}

function ownershipLabel(type: Equipment['ownership']) {
  switch (type) {
    case 'Federal': return 'Federal';
    case 'SLTT': return 'State / Local';
    case 'Private': return 'Private';
  }
}

function ownershipColor(type: Equipment['ownership']) {
  switch (type) {
    case 'Federal': return 'border-blue-800 bg-blue-950/30';
    case 'SLTT': return 'border-amber-800 bg-amber-950/30';
    case 'Private': return 'border-emerald-800 bg-emerald-950/30';
  }
}

export default function AgencyCard({ agencyName, ownershipType, equipment, onClick }: AgencyCardProps) {
  const totalUnits = equipment.reduce((sum, e) => sum + e.quantity, 0);
  const deliveredUnits = equipment.filter(e => e.delivered === 'delivered').reduce((sum, e) => sum + e.quantity, 0);

  const topItems = equipment
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)
    .map(e => `${e.quantity}x ${e.name}`);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-all hover:brightness-125 ${ownershipColor(ownershipType)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {ownershipIcon(ownershipType)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white">{agencyName}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {ownershipLabel(ownershipType)}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 mt-1" />
      </div>

      {/* Stats row */}
      <div className="mt-3 flex gap-3">
        <div className="rounded bg-slate-800/60 px-2 py-1 text-center">
          <div className="text-sm font-bold text-white">{totalUnits}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Units</div>
        </div>
        <div className="rounded bg-slate-800/60 px-2 py-1 text-center">
          <div className="text-sm font-bold text-emerald-400">{deliveredUnits}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Delivered</div>
        </div>
      </div>

      {/* Preview of top equipment */}
      <div className="mt-2 flex flex-wrap gap-1">
        {topItems.map(item => (
          <span key={item} className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300">
            {item}
          </span>
        ))}
        {equipment.length > 3 && (
          <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400">
            +{equipment.length - 3} more
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400">
        <Package className="h-3 w-3" />
        <span>Click to view all hardware</span>
      </div>
    </button>
  );
}
