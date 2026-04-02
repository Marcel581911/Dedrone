import type { Equipment, DeliveryTracker } from '../types';
import { Shield, Building2, Landmark, Package, ChevronRight, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface UnifiedAgencyCardProps {
  name: string;
  ownershipType: Equipment['ownership'];
  equipment: Equipment[];
  tracker: DeliveryTracker | null;
  onViewHardware: (() => void) | null;
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

function statusDot(value: string) {
  const v = value.toLowerCase();
  if (v === 'yes' || v === 'shipped' || v === 'delivered') return 'bg-emerald-400';
  if (v === 'pending' || v === 'order submitted' || v === 'partially shipped' || v === 'scheduled') return 'bg-amber-400';
  if (v === 'shipping in april' || v === 'shipment pending') return 'bg-blue-400';
  if (v === 'no' || v === '-') return 'bg-slate-600';
  if (v === 'n/a') return 'bg-slate-700';
  return 'bg-slate-500';
}

function statusText(value: string) {
  const v = value.toLowerCase();
  if (v === 'yes') return 'text-emerald-300';
  if (v === 'pending' || v === 'order submitted' || v === 'partially shipped' || v === 'scheduled') return 'text-amber-300';
  if (v === 'shipping in april' || v === 'shipment pending') return 'text-blue-300';
  if (v === 'no' || v === '-') return 'text-slate-500';
  if (v === 'n/a') return 'text-slate-600';
  return 'text-slate-400';
}

function TrackerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot(value)}`} />
        <span className={`text-[10px] font-medium ${statusText(value)}`}>{value}</span>
      </div>
    </div>
  );
}

export default function UnifiedAgencyCard({ name, ownershipType, equipment, tracker, onViewHardware }: UnifiedAgencyCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const hasEquipment = equipment.length > 0;
  const totalUnits = equipment.reduce((sum, e) => sum + e.quantity, 0);

  const topItems = equipment
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)
    .map(e => `${e.quantity}x ${e.name}`);

  const isActive = tracker && tracker.dealClosedWon.toLowerCase() !== '-' && tracker.dealClosedWon !== '';
  const hasShipment = tracker && tracker.shipmentStatus !== '-' && tracker.shipmentStatus !== '';

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div>{ownershipIcon(ownershipType)}</div>
          <div>
            <div className="text-sm font-bold text-white">{name}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {ownershipLabel(ownershipType)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {tracker && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              tracker.c2Deployment === 'Deployed' ? 'bg-emerald-900/50 text-emerald-300' :
              tracker.c2Deployment === 'In Progress' ? 'bg-blue-900/50 text-blue-300' :
              tracker.c2Deployment === 'Scoped' ? 'bg-amber-900/50 text-amber-300' :
              'bg-slate-700/50 text-slate-400'
            }`}>
              C2: {tracker.c2Deployment}
            </span>
          )}
          {hasShipment && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              tracker.shipmentStatus === 'Shipped' ? 'bg-emerald-900/50 text-emerald-300' :
              tracker.shipmentStatus === 'Partially Shipped' || tracker.shipmentStatus === 'In Progress' ? 'bg-blue-900/50 text-blue-300' :
              tracker.shipmentStatus === 'Shipping in April' ? 'bg-blue-900/50 text-blue-300' :
              tracker.shipmentStatus === 'Shipment Pending' || tracker.shipmentStatus === 'Pending' ? 'bg-amber-900/50 text-amber-300' :
              'bg-slate-700 text-slate-400'
            }`}>
              {tracker.shipmentStatus}
            </span>
          )}
        </div>
      </div>

      {/* Tracker pipeline steps */}
      {tracker && isActive && (
        <div className="border-t border-slate-700/50 px-4 py-2">
          <div className="grid grid-cols-2 gap-x-4">
            <TrackerRow label="Deal Won" value={tracker.dealClosedWon} />
            <TrackerRow label="PO Received" value={tracker.poReceived} />
            <TrackerRow label="Waiver" value={tracker.waiverReceived} />
            <TrackerRow label="FBI Training" value={tracker.fbiTraining} />
            <TrackerRow label="Ready to Ship" value={tracker.readyForDelivery} />
            <TrackerRow label="Shipment" value={tracker.shipmentStatus} />
          </div>
          <div className="mt-1 space-y-0.5 text-[9px] text-slate-500">
            <div>AE: {tracker.ae} · Owner: {tracker.owner}</div>
            {tracker.salesEngineer && <div>SE: {tracker.salesEngineer}</div>}
            {tracker.installDate && <div>Install: <span className="text-cyan-400">{tracker.installDate}</span></div>}
          </div>
          {tracker.notes && (
            <>
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="mt-1 flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <MessageSquare className="h-2.5 w-2.5" />
                <span>Notes</span>
                {notesOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
              {notesOpen && (
                <p className="mt-1 rounded bg-slate-800/50 px-2 py-1.5 text-[10px] leading-relaxed text-slate-400">
                  {tracker.notes}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Equipment section */}
      {hasEquipment && (
        <div className="border-t border-slate-700/50 px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {topItems.map(item => (
              <span key={item} className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[9px] text-slate-300">
                {item}
              </span>
            ))}
            {equipment.length > 3 && (
              <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[9px] text-slate-500">
                +{equipment.length - 3} more
              </span>
            )}
          </div>
          {onViewHardware && (
            <button
              onClick={onViewHardware}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Package className="h-3 w-3" />
              <span>View all {totalUnits} HW units</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
