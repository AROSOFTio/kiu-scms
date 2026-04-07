import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  PieChart as PieChartIcon,
  RefreshCcw,
  FileText,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#008540', '#ed1c24', '#005596', '#fdb813', '#7a2182', '#00aed9'];

export default function ReportsOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/analytics');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SCMS_Institutional_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <RefreshCcw className="h-12 w-12 text-primary-200 animate-spin mb-4" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Aggregating Institutional Insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Institutional Reporting</h1>
          <p className="text-gray-500 font-medium">Comprehensive data analytics and performance benchmarks.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchAnalytics}
            className="p-2 border border-gray-100 bg-white rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center px-6 py-3 bg-[#008540] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:bg-gray-200 active:scale-95"
          >
             {exporting ? <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
             Export Snapshot
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#008540] opacity-50 transition-all group-hover:w-3" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center justify-between">
            Category Load Distribution
            <PieChartIcon className="h-4 w-4 text-emerald-100" />
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.byCategory.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Trends */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 opacity-50 transition-all group-hover:w-3" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center justify-between">
            Grievance Intake Trends
            <TrendingUp className="h-4 w-4 text-red-50" />
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008540" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#008540" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#008540" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Efficiency */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-50 transition-all group-hover:w-3" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center justify-between">
            Resolution Efficiency (Avg Hours)
            <BarChart3 className="h-4 w-4 text-blue-50" />
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.resolutionTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avgHours" fill="#008540" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Resolution Actions */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-50 transition-all group-hover:w-3" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center justify-between">
            Top Resolution Actions
            <Activity className="h-4 w-4 text-amber-50" />
          </h3>
          <div className="space-y-4">
            {data?.topActions?.length === 0 ? (
               <p className="text-sm font-medium text-gray-400">No resolutions logged yet.</p>
            ) : (
               data?.topActions?.map((item: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-sm font-black text-slate-700 w-3/4 truncate">{item.action}</p>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 shadow-sm">
                     {item.count} Uses
                   </span>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#008540] p-12 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
         <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
         <div className="max-w-2xl relative">
            <BarChart3 className="h-10 w-10 text-emerald-200 mb-8" />
            <h2 className="text-4xl font-black tracking-tighter leading-tight mb-6">Visual Intelligence<br/>Empowers Quick Action.</h2>
            <p className="text-lg text-emerald-50 font-medium leading-relaxed opacity-90 mb-8">
               Our institutional reporting engine analyzes case data to help resolve bottlenecks and ensure every Student's voice is heard at Kampala International University.
            </p>
            <div className="flex gap-4">
               <button className="px-8 py-3 bg-white text-emerald-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detailed PDF Summary
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
