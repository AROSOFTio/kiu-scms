import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  History,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs', { params: { page, limit: 50 } });
      setLogs(res.data.data);
      setTotal(res.data.total);
    } catch (err) {} finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  if (loading && logs.length === 0) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight tracking-tighter">System Audit Trail</h1>
          <p className="text-gray-500 font-medium italic">Immutable record of administrative actions and security events.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-100 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
             <ExternalLink className="mr-2 h-3 w-3" />
             Export Logs (CSV)
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
               <Activity className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Events</p>
               <p className="text-xl font-black text-gray-900 mt-1">{total}</p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
               <Lock className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Global Changes</p>
               <p className="text-xl font-black text-gray-900 mt-1">128</p>
            </div>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
             <input 
                type="text" 
                placeholder="Search logs by action, detail or actor..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[#008540] transition-all"
             />
           </div>
           <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <select className="bg-gray-50 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest">
                 <option>All Actions</option>
                 <option>Create User</option>
                 <option>Status Change</option>
                 <option>Setting Update</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Administrator</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action Type</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Detailed Trace</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                       <Calendar className="h-3.5 w-3.5 text-gray-300" />
                       <span className="text-xs font-bold text-gray-700">{new Date(log.created_at).toLocaleDateString()}</span>
                       <span className="text-xs font-black text-gray-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <User className="h-4 w-4 text-gray-400" />
                       <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{log.first_name} {log.last_name}</p>
                          <p className="text-[10px] text-primary-600 font-black tracking-widest">{log.role_name}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-widest rounded">
                       {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 group/trace">
                       <History className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                       <p className="text-xs font-bold text-gray-600 line-clamp-1 italic group-hover/trace:text-gray-900 transition-colors">
                          {log.details}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                       {log.ip_address || '127.0.0.1'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-500 italic">Showing {logs.length} of {total} records</p>
           <div className="flex gap-2">
              <button 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-30"
              >
                 <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setPage(prev => prev + 1)}
                disabled={logs.length < 50}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-30"
              >
                 <ChevronRight className="h-4 w-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
