import type { Equipment } from '../types';
import StatusBadge from './StatusBadge';
import { Shield, Building2, Landmark } from 'lucide-react';

interface EquipmentTableProps {
  equipment: Equipment[];
}

function ownershipIcon(type: Equipment['ownership']) {
  switch (type) {
    case 'Federal': return <Landmark className="h-4 w-4 text-blue-400" />;
    case 'SLTT': return <Shield className="h-4 w-4 text-amber-400" />;
    case 'Private': return <Building2 className="h-4 w-4 text-emerald-400" />;
  }
}

function dealStatusVariant(status: Equipment['dealStatus']): 'green' | 'yellow' {
  return status === 'closed' ? 'green' : 'yellow';
}

function deliveryReadyVariant(status: Equipment['deliveryReady']): 'green' | 'red' | 'orange' {
  switch (status) {
    case 'yes': return 'green';
    case 'no': return 'red';
    case 'partial': return 'orange';
  }
}

function deliveredVariant(status: Equipment['delivered']): 'green' | 'blue' | 'gray' {
  switch (status) {
    case 'delivered': return 'green';
    case 'in-transit': return 'blue';
    case 'pending': return 'gray';
  }
}

export default function EquipmentTable({ equipment }: EquipmentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-3 py-2">Equipment</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Owner</th>
            <th className="px-3 py-2">Deal</th>
            <th className="px-3 py-2">Ready</th>
            <th className="px-3 py-2">Delivery</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(item => (
            <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              <td className="px-3 py-2.5">
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-xs text-slate-400">{item.model}</div>
              </td>
              <td className="px-3 py-2.5 font-mono text-white">{item.quantity}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  {ownershipIcon(item.ownership)}
                  <div>
                    <div className="text-xs font-medium text-white">{item.ownership}</div>
                    <div className="text-xs text-slate-400">{item.ownerName}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  label={item.dealStatus === 'closed' ? 'Closed' : 'Open'}
                  variant={dealStatusVariant(item.dealStatus)}
                />
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  label={item.deliveryReady === 'yes' ? 'Yes' : item.deliveryReady === 'partial' ? 'Partial' : 'No'}
                  variant={deliveryReadyVariant(item.deliveryReady)}
                />
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  label={item.delivered === 'delivered' ? 'Delivered' : item.delivered === 'in-transit' ? 'In Transit' : 'Pending'}
                  variant={deliveredVariant(item.delivered)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
