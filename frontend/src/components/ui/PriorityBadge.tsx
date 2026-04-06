import { AlertCircle } from 'lucide-react';

export function PriorityBadge({ priority }: { priority: string }) {
  const getStyles = () => {
    switch (priority) {
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200/50 shadow-sm shadow-red-500/10';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200/50';
      default: return 'bg-slate-50 text-slate-600 border-slate-200/50';
    }
  };

  const getIndicator = () => {
    switch (priority) {
      case 'Critical': return 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'High': return 'bg-amber-500';
      case 'Medium': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest leading-none ${getStyles()}`}>
      <span className={`block h-1.5 w-1.5 rounded-full ${getIndicator()}`} />
      {priority}
    </div>
  );
}
