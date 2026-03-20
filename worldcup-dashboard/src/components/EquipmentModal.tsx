import type { Equipment } from '../types';
import EquipmentTable from './EquipmentTable';
import { X, Package } from 'lucide-react';
import { useEffect } from 'react';

interface EquipmentModalProps {
  agencyName: string;
  equipment: Equipment[];
  onClose: () => void;
}

export default function EquipmentModal({ agencyName, equipment, onClose }: EquipmentModalProps) {
  const totalUnits = equipment.reduce((sum, e) => sum + e.quantity, 0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900/60">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{agencyName}</h3>
              <p className="text-xs text-slate-400">{equipment.length} items &middot; {totalUnits} hardware units</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          <EquipmentTable equipment={equipment} />
        </div>
      </div>
    </div>
  );
}
