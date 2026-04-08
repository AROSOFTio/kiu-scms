import { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight
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
      label: 'My Total Cases', 
      value: stats?.total || 0, 
      icon: FileText, 
      bg: 'bg-emerald-50', 
      color: 'text-emerald-600',
      description: 'Total grievances assigned to you'
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
              <span className="text-[#008540]">Staff {user?.lastName}</span>
            </h1>
          </div>
          <TimeDisplay />
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-sm text-slate-500 font-medium">Analyze and resolve institutional grievances assigned to your jurisdiction.</p>
        <Link 
          to="/dashboard/staff/worklist"
          className="inline-flex items-center px-6 py-3 bg-[#008540] text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-900/10 hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
        >
          View Full Worklist
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className={`${kpi.bg} ${kpi.color} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Live Data</span>
            </div>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{kpi.label}</p>
            <p className="text-4xl font-black text-gray-900 mt-1">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-4 font-medium">{kpi.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent My Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <TrendingUp className="h-5 w-5 mr-3 text-[#008540]" />
              Recent Case Updates
            </h2>
            <Link to="/dashboard/staff/worklist" className="text-xs font-black text-[#008540] uppercase tracking-widest hover:underline">View All</Link>
          </div>
          
          <div className="space-y-6">
            {stats?.recentActivity.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No recent activity on your assigned cases.</div>
            ) : stats?.recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                <div className="bg-gray-100 p-3 rounded-xl text-gray-400 group-hover:bg-white group-hover:text-[#008540] transition-all">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">
                      Case #{act.reference_number}
                    </p>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(act.changed_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-bold line-clamp-1">
                    Status updated to <span className="text-[#008540]">"{act.status}"</span> by {act.first_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution (Personal) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col">
          <h2 className="text-lg font-black text-gray-900 tracking-tight mb-8">Resolution Mix</h2>
          <div className="flex-1 space-y-6">
            {stats?.byStatus.map((s) => (
              <div key={s.status} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500 uppercase tracking-tighter">{s.status}</span>
                  <span className="font-black text-gray-900">{s.count}</span>
                </div>
                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      s.status === 'Resolved' ? 'bg-emerald-500' :
                      s.status === 'Rejected' ? 'bg-red-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${(s.count / (stats?.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-50">
             <div className="p-4 bg-[#008540]/5 rounded-xl border border-[#008540]/10">
                <p className="text-[10px] font-black text-[#008540] uppercase tracking-widest mb-1">Success Target</p>
                <p className="text-xs text-[#008540] font-bold">Always aim for a 100% resolution rate on student inquiries.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
