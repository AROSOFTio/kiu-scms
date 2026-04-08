import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  PlusCircle, 
  ArrowRight,
  AlertCircle,
  History,
  ShieldCheck
} from 'lucide-react';
import api from '../../lib/api';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import TimeDisplay from '../../components/dashboard/TimeDisplay';

interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
  recent: any[];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view');
  
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

  const setView = (view: string) => {
    setSearchParams({ view });
  };

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

  // Filtering Logic
  const filteredComplaints = stats?.recent.filter((c: any) => {
    if (currentView === 'processing') return c.status === 'Pending' || c.status === 'In Progress' || c.status === 'Submitted';
    if (currentView === 'resolved') return c.status === 'Resolved';
    return true; 
  }) || [];

  const viewTitle = 
    currentView === 'processing' ? 'Active Processing' :
    currentView === 'resolved' ? 'Verified Resolutions' :
    'Total Tracked Cases';

  const statCardsData = [
    { id: 'all', name: 'Total Tracked Cases', value: stats?.total || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'processing', name: 'Active Processing', value: stats?.open || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: 'resolved', name: 'Verified Resolutions', value: stats?.resolved || 0, icon: CheckCircle, color: 'text-[#008540]', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Welcome Institutional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
               <div className="h-1 w-10 bg-[#008540] rounded-full" />
               <span className="text-[10px] font-black text-[#008540] uppercase tracking-[0.4em]">Administrative Hub</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
              Welcome back,<br />
              <span className="text-[#008540]">Student {user?.lastName}</span>
            </h1>
            {currentView && (
              <p className="text-slate-500 mt-2 font-medium text-sm">
                Currently inspecting: <span className="text-[#008540] font-bold uppercase tracking-widest">{viewTitle}</span>
              </p>
            )}
          </div>
          <TimeDisplay />
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-sm text-slate-500 font-medium">Monitor your institutional grievances and track resolution progress in real-time.</p>
        <Link
          to="/dashboard/student/complaints/new"
          className="inline-flex items-center px-10 py-5 bg-[#008540] text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-900/20 hover:translate-y-[-2px] transition-all group active:scale-95 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4 mr-3 group-hover:rotate-90 transition-transform duration-500" />
          Log New Complaint
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
             Array(3).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          statCardsData.map((stat) => (
            <button 
              key={stat.id} 
              onClick={() => setView(stat.id)}
              className={`premium-card p-10 group relative border shadow-sm text-left transition-all ${currentView === stat.id ? 'border-[#008540] ring-4 ring-[#008540]/5 bg-white' : 'border-transparent hover:border-slate-200 bg-white'}`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                 <stat.icon className="h-20 w-20" />
              </div>
              <div className={`${stat.bg} ${stat.border} border h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.name}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{stat.value}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {currentView && (
        <div className="premium-card flex flex-col animate-in slide-in-from-top-4 duration-500">
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-[#008540]/5 rounded-xl flex items-center justify-center text-[#008540]">
                  <History className="h-5 w-5" />
               </div>
               <div>
                  <h2 className="font-black text-slate-900 text-lg tracking-tighter leading-none mb-1">{viewTitle}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active records for selection</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setView('')} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest px-4">Clear Filter</button>
              <Link to="/dashboard/student/complaints" className="px-5 py-2.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-600 hover:bg-[#008540] hover:text-white transition-all flex items-center group">
                History Archives <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {filteredComplaints.length > 0 ? (
              <table className="w-full text-left table-fixed min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] border-b border-slate-100">
                    <th className="px-10 py-5 w-1/4">Ref ID</th>
                    <th className="px-10 py-5 w-2/5">Subject</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5 text-right w-1/6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredComplaints.map((complaint: any) => (
                    <tr key={complaint.id} className="hover:bg-slate-50/30 transition-all group">
                      <td className="px-10 py-6">
                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-1 rounded text-[10px] tracking-widest">
                          {complaint.reference_number}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                         <div className="max-w-xs">
                            <p className="text-xs font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#008540] transition-colors uppercase truncate">{complaint.title}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-wider uppercase">{complaint.category_name}</p>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          complaint.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <Link 
                          to={`/dashboard/student/complaints/${complaint.id}`} 
                          className="inline-flex items-center gap-2 h-8 px-4 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#008540] transition-all"
                        >
                           Examine
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center">
                 <History className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Zero Matching Records</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {!currentView && (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-16 text-center animate-in fade-in duration-1000">
           <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">Clean Institutional Ledger</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">Select a category above to inspect specific tracking records, or initialize a new case using the action button.</p>
           </div>
        </div>
      )}
      
      {/* Slim Promotional Institutional Card */}
      <div className="bg-[#08271c] rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden group border border-white/5">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
         <div className="relative z-10 flex items-center gap-6">
            <div className="h-12 w-12 flex-shrink-0 bg-white/10 rounded-xl flex items-center justify-center">
               <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
               <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1">Privacy is our <span className="text-emerald-500">Foundation.</span></h2>
               <p className="text-emerald-100/50 font-medium text-[11px] uppercase tracking-wider">
                  Every grievance is end-to-end audit-protected and structurally managed.
               </p>
            </div>
         </div>
         <div className="relative z-10 flex gap-4">
            <Link to="/legal" className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all">Transparency</Link>
            <button className="px-6 py-2.5 bg-white/10 text-white border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Policy</button>
         </div>
      </div>
    </div>
  );
}
