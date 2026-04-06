import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  PieChart
} from 'lucide-react';

export default function ReportsOverview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight tracking-tighter">Institutional Reporting</h1>
          <p className="text-gray-500 font-medium italic">Comprehensive data analytics and performance benchmarks.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-[#008540] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all">
             <Download className="mr-2 h-3.5 w-3.5" />
             Export Institutional Snapshot
          </button>
        </div>
      </div>

      {/* Grid for placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 opacity-50 transition-all group-hover:w-2" />
            <PieChart className="h-20 w-20 text-gray-100 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Case Load Distribution</h3>
            <p className="text-xs text-gray-400 font-bold italic mt-2">Visualizing department-wise grievance volume...</p>
         </div>

         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-amber-500 opacity-50 transition-all group-hover:w-2" />
            <TrendingUp className="h-20 w-20 text-gray-100 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Resolution Trends</h3>
            <p className="text-xs text-gray-400 font-bold italic mt-2">Monthly trajectory of closed vs active cases...</p>
         </div>
      </div>

      <div className="bg-[#008540] p-12 rounded-[3rem] text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
         <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
         <div className="max-w-2xl">
            <BarChart3 className="h-10 w-10 text-emerald-200 mb-8" />
            <h2 className="text-4xl font-black tracking-tight leading-tight mb-6 italic">Deep Insights<br/>Empower Quick Action.</h2>
            <p className="text-lg text-emerald-50 font-medium leading-relaxed opacity-90 mb-8">
               Our reporting engine is currently aggregating historical data. Full interactive visualizers will be deployed in the next minor version.
            </p>
            <div className="flex gap-4">
               <button className="px-8 py-3 bg-white text-emerald-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all">
                  Schedule Report
               </button>
               <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                  Contact Data Office
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
