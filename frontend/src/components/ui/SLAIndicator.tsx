import { Clock, AlertTriangle } from 'lucide-react';

export function SLAIndicator({ priority, createdAt, status }: { priority: string, createdAt: string, status: string }) {
  if (['Resolved', 'Closed', 'Rejected'].includes(status)) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
        <Clock className="h-3 w-3" /> Concluded
      </div>
    );
  }

  const getSLAHours = () => {
    switch (priority) {
      case 'Critical': return 24;
      case 'High': return 48;
      case 'Medium': return 72;
      case 'Low': return 120;
      default: return 72;
    }
  };

  const slaLimitMs = getSLAHours() * 60 * 60 * 1000;
  const elapsedMs = new Date().getTime() - new Date(createdAt).getTime();
  const isBreached = elapsedMs > slaLimitMs;
  
  if (isBreached) {
    const breachHours = Math.floor((elapsedMs - slaLimitMs) / (60 * 60 * 1000));
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest" title="This case has breached its Service Level Agreement">
        <AlertTriangle className="h-3 w-3 animate-pulse" /> Breached (+{breachHours}h)
      </div>
    );
  } else {
    const remainingHours = Math.floor((slaLimitMs - elapsedMs) / (60 * 60 * 1000));
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
        <Clock className="h-3 w-3" /> {remainingHours}h Left
      </div>
    );
  }
}
