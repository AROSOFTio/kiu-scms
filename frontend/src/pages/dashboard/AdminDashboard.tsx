import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Clock, 
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton, CardSkeleton } from '../../components/ui/Skeleton';
import { CommandCards } from '../../components/dashboard/CommandCards';
import { ActivityLogView } from '../../components/dashboard/ActivityLogView';

interface DashboardStats {
  total: number;
  totalUsers: number;
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
  recentActivity: any[];
  slaMetrics: { breached: number; onTrack: number };
}

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'welcome';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err) {
        // Error handling
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

  // Welcome View
  if (activeView === 'welcome') {
    return (
      <div className="max-w-4xl mx-auto py-12 md:py-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 text-[#008540] rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-emerald-100 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Institutional Access Verified
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            Welcome to the <br />
            <span className="text-[#008540]">Institutional Command.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Please select an overview from the sidebar to begin monitoring student interactions, 
            processing grievances, and verifying resolutions.
          </p>
          <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
            <Link 
              to="/dashboard/admin?view=command"
              className="w-full md:w-auto px-10 py-5 bg-[#008540] text-white rounded-[2rem] font-bold text-base shadow-2xl shadow-emerald-900/20 hover:bg-[#066333] transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0"
            >
              <LayoutDashboard className="h-5 w-5" />
              Institutional Command Overview
            </Link>
            <Link 
              to="/dashboard/admin?view=activity"
              className="w-full md:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[2rem] font-bold text-base shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0"
            >
              <Zap className="h-5 w-5" />
              Check Recent Activities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Activity Logs View
  if (activeView === 'activity') {
    return (
      <div className="space-y-10">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/admin?view=welcome" className="text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors uppercase tracking-widest">Dashboard</Link>
          <div className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-slate-900 font-black text-sm uppercase tracking-widest leading-none pt-0.5">Activity Logs</span>
        </div>
        <ActivityLogView activities={stats?.recentActivity || []} />
      </div>
    );
  }

  // Institutional Command View (Default for dashboard view)
  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/admin?view=welcome" className="text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors uppercase tracking-widest">Dashboard</Link>
        <div className="h-1 w-1 rounded-full bg-slate-300" />
        <span className="text-slate-900 font-black text-sm uppercase tracking-widest leading-none pt-0.5">Metrics Overview</span>
      </div>
      
      <CommandCards stats={{
        total: stats?.total || 0,
        activeProcessing: stats?.byStatus.find(s => s.status === 'Submitted')?.count || 0,
        verifiedResolutions: stats?.byStatus.find(s => s.status === 'Resolved')?.count || 0
      }} />

      {/* Category Grid Section from original dashboard */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Category Distribution</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Cross-departmental case analysis</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-inner text-emerald-600">
             <BarChart3 className="h-6 w-6" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {stats?.byCategory.map((cat) => (
            <div key={cat.category} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-50 text-center group hover:bg-white hover:shadow-xl transition-all duration-300">
              <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{cat.count}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-2 leading-tight tracking-wider">{cat.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';
