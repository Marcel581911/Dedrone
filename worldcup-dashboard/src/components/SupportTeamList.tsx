import type { SupportPerson } from '../types';
import { User, Monitor, Phone, Mail } from 'lucide-react';

interface SupportTeamListProps {
  team: SupportPerson[];
}

export default function SupportTeamList({ team }: SupportTeamListProps) {
  return (
    <div className="space-y-2">
      {team.map(person => (
        <div
          key={person.id}
          className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 transition-colors hover:bg-slate-800"
        >
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            person.supportType === 'on-site' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'
          }`}>
            {person.supportType === 'on-site' ? <User className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{person.name}</span>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                person.available
                  ? 'bg-emerald-900/50 text-emerald-300'
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {person.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="text-xs text-slate-400">{person.role}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {person.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {person.email}
              </span>
            </div>
            <div className="mt-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                person.supportType === 'on-site' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                {person.supportType === 'on-site' ? 'On-Site' : 'Virtual Support'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
