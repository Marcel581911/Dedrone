import type { FederalPoolAsset } from '../types';
import StatusBadge from './StatusBadge';
import { Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FederalPoolBannerProps {
  assets: FederalPoolAsset[];
}

export default function FederalPoolBanner({ assets }: FederalPoolBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const totalUnits = assets.reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="border-b border-indigo-900/50 bg-indigo-950/40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-indigo-950/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Federal Pool — DHS S&amp;T
          </span>
          <span className="rounded-full bg-indigo-900/60 border border-indigo-700 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
            {totalUnits} units
          </span>
          <span className="text-[10px] text-indigo-400/70">
            (deployable across all venues)
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-indigo-400" /> : <ChevronDown className="h-4 w-4 text-indigo-400" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-indigo-900 text-[10px] uppercase tracking-wider text-indigo-400">
                <th className="px-3 py-1.5">Equipment</th>
                <th className="px-3 py-1.5">Qty</th>
                <th className="px-3 py-1.5">Owner</th>
                <th className="px-3 py-1.5">Deal</th>
                <th className="px-3 py-1.5">Ready</th>
                <th className="px-3 py-1.5">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} className="border-b border-indigo-900/30 hover:bg-indigo-900/20">
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{asset.name}</div>
                    <div className="text-xs text-indigo-400">{asset.model}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-white">{asset.quantity}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-xs text-white">{asset.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      label={asset.dealStatus === 'closed' ? 'Closed' : 'Open'}
                      variant={asset.dealStatus === 'closed' ? 'green' : 'yellow'}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      label={asset.deliveryReady === 'yes' ? 'Yes' : asset.deliveryReady === 'partial' ? 'Partial' : 'No'}
                      variant={asset.deliveryReady === 'yes' ? 'green' : asset.deliveryReady === 'partial' ? 'orange' : 'red'}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      label={asset.delivered === 'delivered' ? 'Delivered' : asset.delivered === 'in-transit' ? 'In Transit' : 'Pending'}
                      variant={asset.delivered === 'delivered' ? 'green' : asset.delivered === 'in-transit' ? 'blue' : 'gray'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
