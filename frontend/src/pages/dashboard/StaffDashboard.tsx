import { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Star,
  Zap,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import TimeDisplay from '../../components/dashboard/TimeDisplay';

interface DashboardStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
  recentActivity: any[];
  urgentCases: any[];
  recentFeedback: any[];
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err) {
        // Error handling
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchStaffStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    { 
      label: user?.role === 'Department Officer' ? 'Department Total' : 'My Total Cases', 
      value: stats?.total || 0, 
      icon: FileText, 
      bg: 'bg-emerald-50', 
      color: 'text-emerald-600',
      description: user?.role === 'Department Officer' ? 'Grand total of Complaints in department' : 'Total Complaints assigned to you'
    },
    { 
      label: 'Pending Resolution', 
      value: stats?.byStatus.find(s => s.status === 'Submitted' || s.status === 'Under Review' || s.status === 'In Progress')?.count || 0, 
      icon: Clock, 
      bg: 'bg-amber-50', 
      color: 'text-amber-600',
      description: 'Active cases requiring attention'
    },
    { 
      label: 'Resolved by Me', 
      value: stats?.byStatus.find(s => s.status === 'Resolved')?.count || 0, 
      icon: CheckCircle2, 
      bg: 'bg-blue-50', 
      color: 'text-blue-600',
      description: 'Successfully closed cases'
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-6 bg-[#008540]" />
              <span className="text-[10px] font-black text-[#008540] uppercase tracking-widest">Resolution Hub</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              Welcome back,<br />
              <span className="text-[#008540]">{user?.role === 'Department Officer' ? 'Officer' : 'Staff'} {user?.lastName}</span>
            </h1>
          </div>
          <TimeDisplay />
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-sm text-slate-500 font-medium">Analyze and resolve institutional Complaints assigned to your jurisdiction.</p>
        <Link 
          to="/dashboard/staff/worklist"
          className="inline-flex items-center px-6 py-3 bg-[#008540] text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-900/10 hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
        >
          View Full Worklist
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#008540] to-[#006b33] p-8 rounded-2xl shadow-lg shadow-emerald-900/10 text-white relative overflow-hidden group">
          <Zap className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Quick Start</p>
          <h3 className="text-xl font-black mb-6">{user?.role === 'Department Officer' ? 'Supervisor' : 'Staff'}<br/>Workbench</h3>
          <Link 
            to="/dashboard/staff/worklist" 
            className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-bold transition-all"
          >
            Open Worklist
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </div>
        {kpis.map((kpi) => (
          <Link to="/dashboard/staff/worklist" key={kpi.label} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-lg transition-all duration-300 block text-left">
            <div className="flex justify-between items-start mb-6">
              <div className={`${kpi.bg} ${kpi.color} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Live Data</span>
            </div>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{kpi.label}</p>
            <p className="text-4xl font-black text-gray-900 mt-1">{kpi.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent My Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <TrendingUp className="h-5 w-5 mr-3 text-[#008540]" />
              Recent Feed
            </h2>
            <Link to="/dashboard/staff/worklist" className="text-xs font-black text-[#008540] uppercase tracking-widest hover:underline">Full Audit</Link>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {stats?.recentActivity.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium">No recent activity detected.</div>
            ) : stats?.recentActivity.map((act) => (
              <Link key={act.id} to={`/dashboard/staff/complaints/${act.complaint_id || act.id}`} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group block text-left">
                <div className="bg-gray-100 p-3 rounded-xl text-gray-400 group-hover:bg-white group-hover:text-[#008540] transition-all">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(act.changed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-800 font-bold leading-tight">
                    <span className="text-[#008540]">#{act.reference_number}:</span> Status set to {act.status === 'Submitted' ? 'Pending' : act.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Priority Action Required */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 text-rose-500" />
              Critical Attention
            </h2>
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded uppercase tracking-widest">
              {stats?.urgentCases?.length || 0}
            </span>
          </div>

          <div className="space-y-4">
            {stats?.urgentCases.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-dashed border-gray-200">
                All high-priority cases are stabilized.
              </div>
            ) : (
              stats?.urgentCases.map((c) => (
                <Link key={c.id} to={`/dashboard/staff/complaints/${c.id}`} className="block bg-white p-5 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        c.priority === 'Critical' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {c.priority}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {Math.round((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600))}h ago
                      </span>
                   </div>
                   <h4 className="text-sm font-black text-gray-900 leading-tight group-hover:text-rose-600 transition-colors mb-1 truncate">
                     {c.title}
                   </h4>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                     Ref: {c.reference_number} • {c.status}
                   </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Status Distribution (Personal) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Resolution Mix</h2>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex-1 space-y-6">
            {stats?.byStatus.map((s) => (
              <div key={s.status} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500 uppercase tracking-tighter">{s.status === 'Submitted' ? 'Pending' : s.status}</span>
                  <span className="font-black text-gray-900">{s.count}</span>
                </div>
                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      s.status === 'Resolved' ? 'bg-emerald-500' :
                      s.status === 'Rejected' ? 'bg-red-500' : 
                      s.status === 'Submitted' ? 'bg-amber-500' :
                      'bg-indigo-500'
                    }`}
                    style={{ width: `${(s.count / (stats?.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-50">
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                  <PlusCircle className="h-3 w-3 mr-1" /> Quick Navigation
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/dashboard/staff/worklist?status=Submitted" className="text-[10px] font-black bg-white border border-gray-200 px-2 py-1 rounded hover:border-[#008540] transition-colors">Pending Review</Link>
                  <Link to="/dashboard/staff/worklist?status=In Progress" className="text-[10px] font-black bg-white border border-gray-200 px-2 py-1 rounded hover:border-[#008540] transition-colors">Active Cases</Link>
                </div>
             </div>
          </div>
        </div>

        {/* Student Voice - Feedback */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <MessageSquare className="h-5 w-5 mr-3 text-indigo-500" />
              Student Voice
            </h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latest Feedback</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats?.recentFeedback?.length === 0 ? (
              <div className="md:col-span-3 py-12 text-center text-gray-400 font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                Awaiting student feedback on your resolved cases.
              </div>
            ) : (
              stats?.recentFeedback?.map((fb) => (
                <div key={fb.id} className="p-6 rounded-2xl bg-indigo-50/30 border border-indigo-100 relative group">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-3 w-3 ${star <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 italic leading-relaxed mb-4">"{fb.comments || 'No comments left.'}"</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Case #{fb.reference_number}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{fb.first_name} {fb.last_name.charAt(0)}.</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
