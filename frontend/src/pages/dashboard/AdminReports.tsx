import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Printer, 
  TrendingUp, 
  CheckCircle, 
  FileText
} from 'lucide-react';
import api from '../../lib/api';

interface ReportData {
  total: number;
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
}

export default function AdminReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data.data);
      } catch (err) {
        // Error handling
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="h-80 bg-gray-100 rounded-2xl" />
           <div className="h-80 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Intelligence</h1>
          <p className="text-gray-500 mt-1 font-medium">Comprehensive analytical report of institutional grievances.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold text-sm text-gray-700 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Summary
          </button>
          <button 
            className="inline-flex items-center px-6 py-3 bg-[#008540] text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-900/10 hover:shadow-xl transition-all active:scale-95"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 print:border-none print:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <PieChart className="h-5 w-5 mr-3 text-primary-600" />
              Resolution Breakdown
            </h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">By Status</span>
          </div>
          
          <div className="space-y-6">
            {data?.byStatus.map((s) => (
              <div key={s.status} className="group">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-bold text-gray-700">{s.status}</span>
                   <span className="text-sm font-black text-gray-900">{s.count} <span className="text-gray-400 font-medium ml-1">({data?.total ? Math.round((s.count/data.total)*100) : 0}%)</span></span>
                </div>
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      s.status === 'Resolved' ? 'bg-emerald-500' :
                      s.status === 'Submitted' ? 'bg-blue-500' :
                      s.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${(s.count / (data?.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 print:border-none print:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <BarChart3 className="h-5 w-5 mr-3 text-indigo-600" />
              Grievance Channels
            </h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">By Category</span>
          </div>

          <div className="space-y-4">
             {data?.byCategory.map((cat) => (
               <div key={cat.category} className="flex items-center">
                  <div className="w-32 flex-shrink-0 text-xs font-bold text-gray-500 truncate mr-4">{cat.category}</div>
                  <div className="flex-1 h-8 bg-gray-50 rounded-lg relative overflow-hidden group">
                     <div 
                        className="absolute inset-y-0 left-0 bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-all rounded-r-lg border-r-2 border-indigo-500"
                        style={{ width: `${Math.max((cat.count / (data?.total || 1)) * 100, 2)}%` }}
                     />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-900">{cat.count}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 no-print">
         <div className="p-8 bg-gray-900 text-white rounded-2xl shadow-xl space-y-4">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Efficiency Rate</p>
              <p className="text-3xl font-black">{data?.total ? Math.round((data.byStatus.find(s => s.status === 'Resolved')?.count || 0) / data.total * 100) : 0}%</p>
            </div>
            <p className="text-xs text-gray-400">Percentage of resolved grievances vs total cases submitted.</p>
         </div>

         <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Success Count</p>
              <p className="text-3xl font-black text-gray-900">{data?.byStatus.find(s => s.status === 'Resolved')?.count || 0}</p>
            </div>
            <p className="text-xs text-gray-500">Total number of students who had their issues fully resolved.</p>
         </div>

         <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Intake</p>
              <p className="text-3xl font-black text-gray-900">{data?.byStatus.find(s => s.status === 'Submitted')?.count || 0}</p>
            </div>
            <p className="text-xs text-gray-500">Current volume of new cases waiting for administrative review.</p>
         </div>
      </div>

      <div className="hidden print:block border-t-2 border-gray-100 mt-20 pt-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
         Kampala International University — SCMS Official Intelligence Report
      </div>
    </div>
  );
}
