import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  PlusCircle, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { CardSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
  recent: any[];
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/complaints/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to load dashboard data');
      } finally {
        setTimeout(() => setLoading(false), 500); // Small delay for smooth feel
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl shadow-md space-y-4">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-bold text-red-800 tracking-tight">System Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-bold transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statCardsData = [
    { name: 'Total Complaints', value: stats?.total || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Pending Review', value: stats?.open || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Resolved Cases', value: stats?.resolved || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-100/50">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 font-medium italic text-gray-800">Track and manage your institutional grievances.</p>
        </div>
        <Link
          to="/dashboard/student/complaints/new"
          className="inline-flex items-center px-6 py-3 bg-[#008540] hover:bg-[#007036] text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-primary-900/10 hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          New Complaint
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          statCardsData.map((stat) => (
            <div key={stat.name} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
              <div className={`${stat.bg} p-4 rounded-xl mr-5 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              <div className="text-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.name}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-[#008540]">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h2 className="font-black text-gray-800 text-lg tracking-tight">Recent Activity</h2>
          <Link to="/dashboard/student/complaints" className="text-[#008540] hover:text-[#007036] text-sm font-bold flex items-center group">
            View all history <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="divide-y divide-gray-50">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          ) : stats?.recent && stats.recent.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">More</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {stats.recent.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50/80 transition-all group">
                    <td className="px-6 py-5">
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                        {complaint.reference_number}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-800 font-bold max-w-[240px] truncate">{complaint.title}</td>
                    <td className="px-6 py-5 text-gray-500 font-medium">{complaint.category_name}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${
                        complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        complaint.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        complaint.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        to={`/dashboard/student/complaints/${complaint.id}`} 
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-[#008540] hover:text-white rounded-lg transition-all font-bold text-xs"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <EmptyState 
                icon={FileText}
                title="No complaints yet"
                description="Your recent complaints will appear here once you submit them. Click the button below to get started."
                actionLabel="Submit My First Complaint"
                actionLink="/dashboard/student/complaints/new"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
