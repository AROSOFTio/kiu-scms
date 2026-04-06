import { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton, CardSkeleton } from '../../components/ui/Skeleton';

interface DashboardStats {
  total: number;
  totalUsers: number;
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
  recentActivity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to fetch administrative statistics');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center">
      <AlertCircle className="h-5 w-5 mr-3" />
      {error}
    </div>;
  }

  const kpis = [
    { label: 'Total Grievances', value: stats?.total || 0, icon: FileText, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Registered Users', value: stats?.totalUsers || 0, icon: Users, bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { label: 'Pending Cases', value: stats?.byStatus.find(s => s.status === 'Submitted')?.count || 0, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
    { label: 'Resolved Rate', value: `${stats?.total ? Math.round((stats.byStatus.find(s => s.status === 'Resolved')?.count || 0) / stats.total * 100) : 0}%`, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Overview</h1>
        <p className="text-gray-500 mt-1 font-medium italic">General statistics and system activity summary.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-lg transition-all duration-300">
            <div className={`${kpi.bg} ${kpi.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{kpi.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-black text-gray-900 tracking-tight mb-8">Status Metrics</h2>
          <div className="space-y-6">
            {stats?.byStatus.map((s) => (
              <div key={s.status} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-700">{s.status}</span>
                  <span className="font-black text-gray-900">{s.count}</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      s.status === 'Resolved' ? 'bg-emerald-500' :
                      s.status === 'Submitted' ? 'bg-blue-500' :
                      s.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${(s.count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-black text-gray-900 tracking-tight mb-8">Latest Updates</h2>
          <div className="space-y-8">
            {stats?.recentActivity.map((act) => (
              <div key={act.id} className="relative pl-6 border-l-2 border-gray-50 last:border-0 pb-1">
                <div className="absolute -left-[9px] top-0 h-4 w-4 bg-white border-2 border-primary-500 rounded-full" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">
                  {new Date(act.changed_at).toLocaleTimeString()}
                </p>
                <p className="text-xs font-bold text-gray-800 leading-snug">
                   <span className="text-primary-600">{act.first_name}</span> updated <span className="text-gray-900">#{act.reference_number}</span> to <span className="italic">"{act.status}"</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-gray-900 tracking-tight mb-8">Category Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {stats?.byCategory.map((cat) => (
            <div key={cat.category} className="p-4 bg-gray-50/50 rounded-xl border border-gray-50 text-center group hover:bg-white hover:shadow-md transition-all">
              <p className="text-2xl font-black text-gray-900">{cat.count}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 leading-tight">{cat.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
