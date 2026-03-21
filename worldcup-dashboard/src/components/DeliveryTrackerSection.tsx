import type { DeliveryTracker } from '../types';
import { Truck, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface DeliveryTrackerSectionProps {
  tracker: DeliveryTracker[];
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
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot(value)}`} />
        <span className={`text-[11px] font-medium ${statusText(value)}`}>{value}</span>
      </div>
    </div>
  );
}

function TrackerCard({ entry }: { entry: DeliveryTracker }) {
  const [expanded, setExpanded] = useState(false);

  const isActive = entry.dealClosedWon.toLowerCase() !== '-' && entry.dealClosedWon !== '';
  const bgClass = entry.dealClosedWon.toLowerCase() === 'yes'
    ? 'border-emerald-800/40 bg-emerald-950/10'
    : entry.dealClosedWon.toLowerCase() === 'order submitted'
      ? 'border-amber-800/40 bg-amber-950/10'
      : 'border-slate-700/60 bg-slate-800/20';

  return (
    <div className={`rounded-lg border p-3 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{entry.account}</span>
        <div className="flex items-center gap-2">
          {entry.shipmentStatus !== '-' && entry.shipmentStatus !== '' && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              entry.shipmentStatus === 'Partially Shipped' ? 'bg-blue-900/50 text-blue-300' :
              entry.shipmentStatus === 'Shipping in April' ? 'bg-blue-900/50 text-blue-300' :
              entry.shipmentStatus === 'Shipment Pending' ? 'bg-amber-900/50 text-amber-300' :
              'bg-slate-700 text-slate-400'
            }`}>
              {entry.shipmentStatus}
            </span>
          )}
        </div>
      </div>

      {isActive && (
        <div className="mt-2 grid grid-cols-2 gap-x-4">
          <TrackerRow label="Deal Closed" value={entry.dealClosedWon} />
          <TrackerRow label="PO Received" value={entry.poReceived} />
          <TrackerRow label="Waiver" value={entry.waiverReceived} />
          <TrackerRow label="FBI Training" value={entry.fbiTraining} />
          <TrackerRow label="Ready to Ship" value={entry.readyForDelivery} />
          <TrackerRow label="Shipment" value={entry.shipmentStatus} />
        </div>
      )}

      <div className="mt-1 text-[10px] text-slate-500">
        AE: {entry.ae} &middot; Owner: {entry.owner}
      </div>

      {entry.notes && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Notes</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded && (
            <p className="mt-1 rounded bg-slate-800/50 px-2 py-1.5 text-[11px] leading-relaxed text-slate-400">
              {entry.notes}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function DeliveryTrackerSection({ tracker }: DeliveryTrackerSectionProps) {
  const closedCount = tracker.filter(t => t.dealClosedWon.toLowerCase() === 'yes').length;
  const pendingCount = tracker.filter(t => t.dealClosedWon.toLowerCase() === 'order submitted').length;

  return (
    <div className="border-b border-slate-800 px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">Delivery Tracker</span>
        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
          {tracker.length}
        </span>
        {closedCount > 0 && (
          <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] text-emerald-300">
            {closedCount} closed
          </span>
        )}
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] text-amber-300">
            {pendingCount} submitted
          </span>
        )}
      </div>
      <div className="space-y-2">
        {tracker.map(entry => (
          <TrackerCard key={entry.account} entry={entry} />
        ))}
      </div>
    </div>
  );
}
