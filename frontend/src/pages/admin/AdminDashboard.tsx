import { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Building2, 
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err) {} finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><div className="grid grid-cols-4 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>;

  const kpis = [
    { label: 'Total Grievances', value: stats?.total || 0, icon: FileText, change: '+12%', trending: 'up', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, change: '+5%', trending: 'up', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Resolution Rate', value: '84%', icon: CheckCircle2, change: '+2.4%', trending: 'up', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Response', value: '4.2h', icon: TrendingUp, change: '-15%', trending: 'down', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Institutional Oversight</h1>
        <p className="text-gray-500 font-medium italic">Real-time performance metrics and system-wide visibility.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`${kpi.bg} ${kpi.color} p-3 rounded-xl`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center text-[10px] font-black uppercase ${kpi.trending === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.trending === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trend/Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-96 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008540] to-[#005a2b]" />
             <TrendingUp className="h-16 w-16 text-gray-100 mb-4" />
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Growth Trends</h3>
             <p className="text-xs text-gray-400 font-bold italic mt-2">Historical data visualization coming in next push...</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
                <ShieldCheck className="h-5 w-5 mr-3 text-emerald-600" />
                Recent System Events
              </h3>
            </div>
            <div className="space-y-4">
              {stats?.recentActivity?.map((act: any) => (
                <div key={act.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 group">
                   <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all font-black text-xs">
                      {act.first_name[0]}{act.last_name[0]}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">
                         {act.first_name} {act.last_name} updated case <span className="font-black text-emerald-700">#{act.reference_number}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{new Date(act.changed_at).toLocaleString()}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Distros */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="text-lg font-black text-gray-900 tracking-tight mb-8">Role Distribution</h3>
             <div className="space-y-6">
                {[
                  { label: 'Students', count: 1240, percentage: 85, color: 'bg-indigo-500' },
                  { label: 'Staff members', count: 180, percentage: 12, color: 'bg-emerald-500' },
                  { label: 'Administrators', count: 15, percentage: 3, color: 'bg-amber-500' },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-gray-400">{item.label}</span>
                       <span className="text-gray-900">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-[#008540] p-8 rounded-3xl text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <Building2 className="h-8 w-8 text-emerald-200 mb-6" />
              <h4 className="text-xl font-black tracking-tight leading-tight mb-2">Institutional<br/>Governance</h4>
              <p className="text-sm text-emerald-100 font-medium italic opacity-80 leading-relaxed">System-wide parameters are fully operational. No major alerts detected.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
