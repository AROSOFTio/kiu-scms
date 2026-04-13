import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  History,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import TimeDisplay from '../../components/dashboard/TimeDisplay';

// --- Sub-Components ---

const WelcomeView = ({ user, stats }: { user: any, stats: any }) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em]">HOD Governance Center</span>
        </div>
        <h1 className="text-5xl font-bold text-slate-900 tracking-tighter mb-4 leading-[0.9]">
          Welcome back,<br />
          <span className="text-emerald-600">HOD {user?.lastName}</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium leading-relaxed">
          The Student Complaint and Management System is fully operational. 
          You currently have <span className="text-slate-900 font-bold">{stats?.total || 0} active Complaints</span> requiring oversight.
        </p>
      </div>
      
      <TimeDisplay />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Link to="/dashboard/admin/complaints" className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <FileText size={120} />
        </div>
        <div className="relative z-10 text-emerald-600 mb-6">
          <FileText className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Active Cases</h3>
        <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Review and delegate recently filed institutional Complaints.</p>
        <div className="flex items-center text-sm font-bold text-emerald-600 group-hover:gap-2 transition-all">
          Manage Repository <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      </Link>

      <Link to="/dashboard/admin/reports" className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <BarChart3 size={120} />
        </div>
        <div className="relative z-10 text-emerald-600 mb-6">
          <BarChart3 className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">System Performance</h3>
        <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Audit system resolution metrics and institutional efficiency.</p>
        <div className="flex items-center text-sm font-bold text-emerald-600 group-hover:gap-2 transition-all">
          View Analytical Reports <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      </Link>

      <Link to="/dashboard/appointments" className="group bg-emerald-600 p-10 rounded-[40px] shadow-2xl shadow-emerald-900/20 text-white transition-all duration-500 relative overflow-hidden text-left block">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock size={120} />
        </div>
        <div className="relative z-10 text-emerald-200 mb-6 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">Calendar Management</div>
        <h3 className="text-2xl font-bold mb-2 tracking-tight">Appointments</h3>
        <p className="text-emerald-100/70 font-medium text-sm mb-6 leading-relaxed">Manage student consultation requests and office hours.</p>
        <div className="flex items-center text-sm font-bold text-white bg-white/10 w-fit px-6 py-3 rounded-2xl group-hover:bg-white/20 transition-all">
          Open Calendar
        </div>
      </Link>
    </div>
  </div>
);

const InstitutionalCommandView = ({ stats }: { stats: any }) => {
  const kpis = [
    { label: 'Total Complaints', value: stats?.total || 0, icon: FileText, change: '+12%', trending: 'up', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, change: '+5%', trending: 'up', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Resolution Rate', value: '84%', icon: CheckCircle2, change: '+2.4%', trending: 'up', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Response', value: '4.2h', icon: TrendingUp, change: '-15%', trending: 'down', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">HOD Oversight</h1>
          <p className="text-gray-500 font-medium">Real-time performance metrics and department-wide visibility.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
           <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white rounded-xl">Last 24h</button>
           <button className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Last 7d</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`${kpi.bg} ${kpi.color} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center text-[11px] font-bold uppercase ${kpi.trending === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.trending === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-4xl font-bold text-gray-900 tracking-tighter tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm h-[480px] flex flex-col relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-700" />
           <div className="flex items-center justify-between mb-12">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Institutional Response Trends</h3>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Resolution</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200" /> Submissions</div>
              </div>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <TrendingUp size={80} className="text-slate-300 mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Intelligent Charting Offline</p>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
           <h3 className="text-xl font-black text-gray-900 tracking-tight mb-10">Institutional Mix</h3>
           <div className="space-y-8">
              {[
                { label: 'Students', count: 1240, percentage: 85, color: 'bg-indigo-500' },
                { label: 'Staff members', count: 180, percentage: 12, color: 'bg-emerald-500' },
                { label: 'HODs', count: 15, percentage: 3, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em]">
                     <span className="text-gray-400">{item.label}</span>
                     <span className="text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                     <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const ActivityLogView = ({ stats }: { stats: any }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
    <div className="max-w-2xl">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Events Audit</h1>
      <p className="text-gray-500 font-medium leading-relaxed mt-2">
        A real-time ledger of institutional governance actions across the Kampala International University network.
      </p>
    </div>

    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
          <Clock className="h-4 w-4 mr-3 text-emerald-600" />
          Real-time Audit Stream
        </h3>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">
          Live Connection Active
        </div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {stats?.recentActivity?.map((act: any) => (
          <div key={act.id} className="p-8 hover:bg-slate-50 transition-all group flex items-start gap-6">
             <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 font-black group-hover:border-emerald-200 group-hover:text-emerald-600 transition-all">
                {act.first_name[0]}{act.last_name[0]}
             </div>
             <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-base font-bold text-slate-900 leading-none">
                    {act.first_name} {act.last_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight tabular-nums">
                    {new Date(act.changed_at).toLocaleTimeString()}
                  </p>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Institutional oversight action on case <span className="text-emerald-700 font-black">#{act.reference_number}</span>
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                    <History className="h-3 w-3" /> Event Log ID: {act.id.toString().substring(0, 8)}
                  </div>
                </div>
             </div>
          </div>
        ))}
        {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
          <div className="p-20 text-center">
            <ShieldCheck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No recent audit events discovered</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'welcome';
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/auth/me')
        ]);
        setStats(statsRes.data.data);
        setUser(userRes.data.data);
      } catch (err) {
        console.error('Failed to resolve institutional oversight metrics');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-pulse">
        <Skeleton className="h-12 w-1/3 mb-10 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Skeleton className="h-64 rounded-[40px]" />
           <Skeleton className="h-64 rounded-[40px]" />
           <Skeleton className="h-64 rounded-[40px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      {currentView === 'welcome' && <WelcomeView user={user} stats={stats} />}
      {currentView === 'command' && <InstitutionalCommandView stats={stats} />}
      {currentView === 'activity' && <ActivityLogView stats={stats} />}
    </div>
  );
}
