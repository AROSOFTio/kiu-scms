import { FileText, Clock, CheckCircle, Plus } from 'lucide-react';

interface CommandStats {
  total: number;
  activeProcessing: number;
  verifiedResolutions: number;
}

export function CommandCards({ stats }: { stats: CommandStats | null }) {
  const cards = [
    {
      label: 'TOTAL TRACKED CASES',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      ghostColor: 'text-blue-500/5'
    },
    {
      label: 'ACTIVE PROCESSING',
      value: stats?.activeProcessing || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      ghostColor: 'text-amber-500/5'
    },
    {
      label: 'VERIFIED RESOLUTIONS',
      value: stats?.verifiedResolutions || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      ghostColor: 'text-emerald-500/5'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-12 bg-[#008540]" />
            <span className="text-[10px] font-black text-[#008540] uppercase tracking-[0.3em]">Administrative Overview</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Institutional <span className="text-[#008540]">Command.</span></h1>
          <p className="text-slate-500 mt-4 max-w-xl font-medium leading-relaxed">
            Centralized monitoring of your academic and institutional interactions at Kampala International University.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#008540] text-white px-8 py-4 rounded-3xl font-bold text-sm shadow-lg shadow-emerald-900/20 hover:bg-[#066333] transition-all hover:scale-105 active:scale-95 group">
          <div className="p-1 border border-white/30 rounded-full group-hover:rotate-90 transition-transform">
             <Plus className="h-4 w-4" />
          </div>
          PROPOSE RESOLUTION
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
            {/* Ghost Icon */}
            <card.icon 
              className={`absolute -right-4 -bottom-4 h-40 w-40 ${card.ghostColor} transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12`} 
              strokeWidth={1}
            />
            
            <div className="relative z-10">
              <div className={`${card.bgColor} ${card.color} h-14 w-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner`}>
                <card.icon className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-2 uppercase">{card.label}</p>
              <p className="text-5xl font-black text-slate-900 tracking-tighter">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
