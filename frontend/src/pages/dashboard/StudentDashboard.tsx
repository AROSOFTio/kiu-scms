import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  PlusCircle, 
  ArrowRight,
  AlertCircle,
  Briefcase,
  History
} from 'lucide-react';
import api from '../../lib/api';
import { TableRowSkeleton, StatSkeleton } from '../../components/ui/Skeleton';

interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
  recent: any[];
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/complaints/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to load institutional telemetry data bank.');
      } finally {
        setTimeout(() => setLoading(false), 600); 
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="premium-card bg-red-50/50 border-red-100 p-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-20 animate-in zoom-in duration-500">
        <div className="h-16 w-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-red-500 mb-6">
           <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2">Protocol Disruption</h3>
        <p className="text-red-700/70 text-sm font-bold mb-8 leading-relaxed px-10">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/10 hover:translate-y-[-2px] active:scale-95 transition-all"
        >
          Initialize Re-sync
        </button>
      </div>
    );
  }

  const statCardsData = [
    { name: 'Total Tracked Cases', value: stats?.total || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: 'Active Processing', value: stats?.open || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { name: 'Verified Resolutions', value: stats?.resolved || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Welcome Institutional Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-1 w-12 bg-[#008540] rounded-full" />
             <span className="text-[10px] font-black text-[#008540] uppercase tracking-[0.4em]">Administrative Overview</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
            Institutional <span className="text-emerald-600">Command.</span>
          </h1>
          <p className="text-slate-500 mt-4 font-medium max-w-xl leading-relaxed italic">
            Centralized monitoring of your academic and institutional interactions at Kampala International University.
          </p>
        </div>
        <Link
          to="/dashboard/student/complaints/new"
          className="inline-flex items-center px-10 py-5 bg-[#008540] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-900/20 hover:translate-y-[-2px] transition-all group active:scale-95"
        >
          <PlusCircle className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
          Propose Resolution
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
             Array(3).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          statCardsData.map((stat) => (
            <div key={stat.name} className="premium-card p-10 group relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <stat.icon className="h-24 w-24" />
              </div>
              <div className={`${stat.bg} ${stat.border} border h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.name}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="premium-card flex flex-col">
        <div className="p-10 lg:p-12 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/20">
          <div className="flex items-center gap-5">
             <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-600">
                <History className="h-6 w-6" />
             </div>
             <div>
                <h2 className="font-black text-slate-900 text-xl tracking-tighter leading-none mb-1">Recent Activity Logs</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal auditing of your latest cases</p>
             </div>
          </div>
          <Link to="/dashboard/student/complaints" className="px-6 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-600 hover:text-emerald-600 hover:border-emerald-100 shadow-sm transition-all flex items-center group">
            History Archives <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array(3).fill(0).map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
          ) : stats?.recent && stats.recent.length > 0 ? (
            <table className="w-full text-left table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-white text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] border-b border-slate-50">
                  <th className="px-12 py-6 w-1/4">Assessment ID</th>
                  <th className="px-12 py-6 w-2/5">Grievance Narrative</th>
                  <th className="px-12 py-6">Current State</th>
                  <th className="px-12 py-6 text-right w-1/6">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recent.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-12 py-8">
                      <span className="font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl text-[11px] tracking-widest shadow-inner">
                        {complaint.reference_number}
                      </span>
                    </td>
                    <td className="px-12 py-8">
                       <div className="max-w-xs xl:max-w-md">
                          <p className="text-sm font-black text-slate-900 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors uppercase truncate">{complaint.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{complaint.category_name}</p>
                       </div>
                    </td>
                    <td className="px-12 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        complaint.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                        complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-12 py-8 text-right">
                      <Link 
                        to={`/dashboard/student/complaints/${complaint.id}`} 
                        className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#008540] hover:translate-x-1 transition-all shadow-lg active:scale-90"
                      >
                         <Briefcase className="h-3 w-3" />
                         Examine
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-24 text-center">
               <div className="flex flex-col items-center opacity-30">
                  <History className="h-16 w-16 mb-6 animate-pulse" />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">No Temporal Activity</h3>
                  <p className="text-sm font-medium mt-2">Historical data banks currently waiting for first entry.</p>
               </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Promotional Institutional Card */}
      <div className="bg-[#08271c] rounded-[3rem] p-12 lg:p-20 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
         <div className="relative z-10 max-w-2xl">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mb-8" />
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-8">Your Privacy is <br/> our <span className="text-emerald-500">Foundation.</span></h2>
            <p className="text-emerald-100/60 font-medium text-lg leading-relaxed mb-10">
               Every grievance submitted through the SCMS portal is end-to-end audit-protected. Your identity and institutional records are managed with structural integrity.
            </p>
            <div className="flex flex-wrap gap-4">
               <Link to="/legal" className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all">Transparency Report</Link>
               <button className="px-8 py-3 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Data Privacy Policy</button>
            </div>
         </div>
      </div>
    </div>
  );
}

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
