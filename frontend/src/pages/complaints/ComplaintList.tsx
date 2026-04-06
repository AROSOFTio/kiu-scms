import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  ChevronRight, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';

export default function ComplaintList() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [compRes, catRes] = await Promise.all([
          api.get('/complaints', { 
            params: { 
              search: search || undefined,
              status: statusFilter || undefined,
              category: categoryFilter || undefined,
              page,
              limit
            }
          }),
          api.get('/complaints/categories')
        ]);
        setComplaints(compRes.data.data);
        setTotal(compRes.data.total);
        setCategories(catRes.data.data);
      } catch (err: any) {
        setError('Failed to load complaints');
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    const timer = setTimeout(fetchData, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, statusFilter, categoryFilter, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-amber-100 text-amber-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Grievance Records</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and track your submitted complaints.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100/60 shadow-sm flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full text-gray-800">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input pl-12 pr-4 bg-slate-50"
          />
        </div>
        
        <div className="flex gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-48 text-slate-800">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="premium-input pl-11 pr-8 bg-slate-50 appearance-none font-bold"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-52 text-slate-800">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              className="premium-input pl-11 pr-8 bg-slate-50 appearance-none font-bold"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex-1">
          {loading ? (
            <div className="divide-y divide-slate-50 border-b border-slate-50">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          ) : error ? (
            <div className="p-24 text-center text-red-500 flex flex-col items-center">
              <AlertCircle className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-xl font-bold">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-all"
              >
                Retry Loading
              </button>
            </div>
          ) : complaints.length > 0 ? (
            <div className="divide-y divide-slate-50/80 text-slate-800 border-b border-slate-50">
              {complaints.map((complaint) => (
                <Link
                  key={complaint.id}
                  to={`/dashboard/student/complaints/${complaint.id}`}
                  className="block hover:bg-slate-50/50 hover:-translate-y-[1px] hover:shadow-md hover:shadow-slate-200/20 transition-all p-6 md:p-8 lg:p-10 group bg-white border-b border-transparent relative z-10"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-[10px] md:text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg tracking-widest uppercase">
                          {complaint.reference_number}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest ${getStatusStyle(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 leading-tight group-hover:text-[#008540] transition-colors text-xl md:text-2xl tracking-tight">{complaint.title}</h3>
                      <div className="flex flex-wrap items-center text-xs text-slate-500 gap-x-6 gap-y-3 font-bold">
                        <span className="flex items-center"><FileText className="h-4 w-4 mr-2" /> {complaint.category_name}</span>
                        <span className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> {new Date(complaint.created_at).toLocaleDateString()}</span>
                        <PriorityBadge priority={complaint.priority} />
                        <SLAIndicator priority={complaint.priority} createdAt={complaint.created_at} status={complaint.status} />
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mt-4 group-hover:bg-[#008540] group-hover:border-[#008540] transition-all duration-300">
                       <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-20">
               <EmptyState 
                icon={FileText}
                title="No grievances found"
                description="Your search did not match any of your submitted records. Try clearing filters or submit a new case."
                actionLabel="Submit New Complaint"
                actionLink="/dashboard/student/complaints/new"
              />
            </div>
          )}
        </div>

        {/* Pagination UI */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-gray-500 font-medium text-gray-800">
              Showing <span className="font-bold">{((page - 1) * limit) + 1}</span> to <span className="font-bold">{Math.min(page * limit, total)}</span> of <span className="font-bold">{total}</span> complaints
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors text-gray-800"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-4 py-2 text-sm font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors text-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
