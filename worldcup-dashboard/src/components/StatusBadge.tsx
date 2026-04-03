interface StatusBadgeProps {
  label: string;
  variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange';
}

const variantClasses: Record<StatusBadgeProps['variant'], string> = {
  green: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  yellow: 'bg-amber-900/60 text-amber-300 border-amber-700',
  red: 'bg-red-900/60 text-red-300 border-red-700',
  blue: 'bg-blue-900/60 text-blue-300 border-blue-700',
  gray: 'bg-slate-700/60 text-slate-300 border-slate-600',
  orange: 'bg-orange-900/60 text-orange-300 border-orange-700',
};

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}
