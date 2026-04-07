import { History, ArrowRight } from 'lucide-react';

interface Activity {
  id: number;
  changed_at: string;
  first_name: string;
  reference_number: string;
  status: string;
}

export function ActivityLogView({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shadow-inner">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity Logs</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Temporal auditing of your latest cases</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all group">
          History Archives <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {activities.map((act) => (
          <div key={act.id} className="relative pl-10 border-l-2 border-slate-50 group hover:border-emerald-500 transition-colors">
            <div className="absolute -left-2.5 top-0 h-5 w-5 bg-white border-[3px] border-slate-100 rounded-full group-hover:border-emerald-500 group-hover:scale-110 transition-all" />
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                {new Date(act.changed_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <p className="text-sm font-bold text-slate-700 leading-snug">
                <span className="text-emerald-600 font-black">{act.first_name}</span> updated case <span className="text-slate-900 font-black">#{act.reference_number}</span> to <span className="text-slate-900 underline decoration-emerald-500/30">"{act.status}"</span>
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400 font-bold">No recent activities to display.</div>
        )}
      </div>
    </div>
  );
}
