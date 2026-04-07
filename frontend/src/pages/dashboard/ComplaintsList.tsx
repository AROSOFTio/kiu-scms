import { 
  Search, 
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ArrowRight,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { TableRowSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SLAIndicator } from '../../components/ui/SLAIndicator';

interface Complaint {
  id: number;
  reference_number: string;
  title: string;
  status: string;
  priority: string;
  category_name: string;
  created_at: string;
  student_first_name: string;
  student_last_name: string;
  staff_first_name?: string;
  staff_last_name?: string;
}

interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  role_name: string;
}

export default function ComplaintsList() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff';
  const isWorklist = location.pathname.includes('/staff/worklist');
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState(isWorklist);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStaffId, setTargetStaffId] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = { search, status, priority, page, limit };
        if (assignedToMe) params.assignedToMe = 'true';
        
        const res = await api.get('/admin/complaints', { params });
        setComplaints(res.data.data);
        setTotal(res.data.total);
      } catch (err) {
        console.error('Fetch failed');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    const timer = setTimeout(fetchData, 400);
    return () => clearTimeout(timer);
  }, [search, status, priority, page, assignedToMe]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/staff').then(res => setStaffList(res.data.data));
    }
  }, [isAdmin]);

  const handleAssign = async () => {
    if (!selectedComplaint || !targetStaffId) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${selectedComplaint.id}/assign`, { staffId: targetStaffId });
      setAssignModalOpen(false);
      const res = await api.get('/admin/complaints', { params: { search, status, priority, page, limit } });
      setComplaints(res.data.data);
    } catch (err) {
      alert('Failed to assign staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint || !targetStatus || !remarks) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${selectedComplaint.id}/status`, { status: targetStatus, remarks });
      setStatusModalOpen(false);
      setRemarks('');
      const res = await api.get('/admin/complaints', { params: { search, status, priority, page, limit } });
      setComplaints(res.data.data);
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Resolved': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50';
      case 'Rejected': return 'bg-red-100/50 text-red-700 border-red-200/50';
      case 'In Progress': return 'bg-amber-100/50 text-amber-700 border-amber-200/50';
      case 'Under Review': return 'bg-blue-100/50 text-blue-700 border-blue-200/50';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="h-1 w-12 bg-[#008540] rounded-full" />
             <span className="text-[10px] font-black text-[#008540] uppercase tracking-[0.4em]">Case Repository</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {isWorklist ? 'Resolution Worklist' : 'Grievance Intelligence'}
          </h1>
          <p className="text-slate-500 mt-3 font-medium max-w-2xl leading-relaxed">
            {isWorklist 
              ? 'Managed workspace for cases explicitly assigned to your jurisdiction.' 
              : 'End-to-end audit trail of all institutional grievances logged across Kampala International University.'}
          </p>
        </div>
        {isStaff && !isWorklist && (
           <button 
             onClick={() => setAssignedToMe(!assignedToMe)}
             className={`group relative px-8 py-4 rounded-3xl text-xs font-black transition-all overflow-hidden ${
               assignedToMe 
                 ? 'bg-[#008540] text-white shadow-[0_20px_40px_-10px_rgba(0,133,64,0.3)]' 
                 : 'bg-white border border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
             }`}
           >
             <span className="relative z-10 flex items-center gap-2">
                {assignedToMe ? 'Viewing: Exclusive Worklist' : 'Switch to: Assigned Cases'}
                <ArrowRight className={`h-4 w-4 transition-transform duration-500 ${assignedToMe ? 'rotate-180' : 'group-hover:translate-x-1'}`} />
             </span>
          </button>
        )}
      </div>

      {/* Advanced Filters Overlay */}
      <div className="premium-card p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Reference, Title or Student Identity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input pl-16 py-5 text-base"
          />
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
             <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none appearance-none transition-all"
              >
                <option value="">Status: All</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
          </div>
          <div className="relative flex-1 lg:w-48">
             <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
             <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none appearance-none transition-all"
              >
                <option value="">Priority: All</option>
                <option value="Critical">Critical Only</option>
                <option value="High">High Only</option>
                <option value="Medium">Medium Only</option>
                <option value="Low">Low Only</option>
              </select>
          </div>
        </div>
      </div>

      {/* Main Data View */}
      <div className="premium-card min-h-[600px] flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">
                <th className="px-10 py-6">Identity Reference</th>
                <th className="px-10 py-6">Grievance Origin</th>
                <th className="px-10 py-6">Intellectual Map</th>
                <th className="px-10 py-6">Assigned Jurisdiction</th>
                <th className="px-10 py-6">Lifecycle Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-40 text-center">
                     <div className="flex flex-col items-center opacity-30">
                        <Loader2 className="h-12 w-12 mb-4 animate-spin-slow rotate-12" />
                        <p className="text-sm font-black uppercase tracking-widest">Zero matches in historical data</p>
                     </div>
                  </td>
                </tr>
              ) : complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-all duration-300 group">
                  <td className="px-10 py-8">
                    <span className="font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl text-[11px] tracking-widest">{c.reference_number}</span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                          {c.student_first_name[0]}{c.student_last_name[0]}
                       </div>
                       <div>
                          <p className="font-black text-sm text-slate-900 uppercase tracking-tight leading-none mb-1">{c.student_first_name} {c.student_last_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Institutional Student</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 max-w-[280px]">
                    <Link 
                      to={isStaff ? `/dashboard/staff/complaints/${c.id}` : '#'} 
                      className={`font-black text-sm text-slate-900 transition-colors leading-snug block truncate group-hover:text-[#008540] ${!isStaff && 'pointer-events-none'}`}
                    >
                      {c.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="h-1 w-1 rounded-full bg-slate-300" />
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.category_name}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {c.staff_first_name ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                           <User className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black text-slate-700 tracking-tight">{c.staff_first_name} {c.staff_last_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-30">
                         <MoreHorizontal className="h-4 w-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Vacant</span>
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit shadow-sm ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <PriorityBadge priority={c.priority} />
                        <SLAIndicator priority={c.priority} createdAt={c.created_at} status={c.status} />
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {isAdmin && (
                        <button 
                          onClick={() => { setSelectedComplaint(c); setAssignModalOpen(true); }}
                          className="h-10 w-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <UserPlus className="h-5 w-5" />
                        </button>
                      )}
                      {isStaff ? (
                        <Link 
                          to={`/dashboard/staff/complaints/${c.id}`}
                          className="h-10 w-10 flex items-center justify-center bg-emerald-50 text-[#008540] rounded-xl hover:bg-[#008540] hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Link>
                      ) : (
                        <button 
                          onClick={() => { setSelectedComplaint(c); setTargetStatus(c.status); setStatusModalOpen(true); }}
                          className="h-10 w-10 flex items-center justify-center bg-emerald-50 text-[#008540] rounded-xl hover:bg-[#008540] hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-6 space-y-6">
          {loading ? (
             Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)
          ) : complaints.map((c) => (
             <div key={c.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex justify-between items-start">
                   <span className="font-black text-slate-900 bg-white shadow-sm border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] tracking-widest">{c.reference_number}</span>
                   <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-xs ${getStatusColor(c.status)}`}>
                      {c.status}
                   </span>
                </div>
                <div>
                   <Link to={isStaff ? `/dashboard/staff/complaints/${c.id}` : '#'} className="text-lg font-black text-slate-900 tracking-tight leading-tight block mb-2">{c.title}</Link>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{c.category_name}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px]">
                          {c.student_first_name[0]}{c.student_last_name[0]}
                       </div>
                       <p className="text-xs font-bold text-slate-600">{c.student_first_name} {c.student_last_name}</p>
                   </div>
                   <div className="flex gap-2">
                      {isAdmin && (
                         <button onClick={() => { setSelectedComplaint(c); setAssignModalOpen(true); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><UserPlus className="h-5 w-5"/></button>
                      )}
                      <Link to={`/dashboard/staff/complaints/${c.id}`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="h-5 w-5"/></Link>
                   </div>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Pagination Footer */}
      {total > limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10">
          <div className="flex items-center gap-4">
             <span className="h-2 w-2 rounded-full bg-emerald-200" />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
               Page {page} / {Math.ceil(total / limit)} <span className="mx-2 opacity-20">|</span> Total Capacity: {total}
             </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="h-14 w-14 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 shadow-sm disabled:opacity-30 transition-all hover:bg-slate-50 active:scale-90"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              disabled={page * limit >= total} 
              onClick={() => setPage(p => p + 1)}
              className="h-14 px-8 bg-[#008540] text-white rounded-2xl shadow-xl shadow-emerald-900/20 disabled:opacity-30 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center gap-3"
            >
               <span className="text-xs font-black uppercase tracking-widest">Next Phase</span>
               <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Reused Modals with Premium Touches */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setAssignModalOpen(false)} 
        title="Institutional Delegation"
        footer={
          <>
            <button onClick={() => setAssignModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
            <button 
              onClick={handleAssign} 
              disabled={!targetStaffId || submitting}
              className="px-10 py-4 bg-[#008540] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 disabled:bg-slate-200"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
            </button>
          </>
        }
      >
        <div className="space-y-8">
           <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-6">
              <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600">
                 <AlertCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Assessment</p>
                <p className="text-lg text-slate-900 font-black tracking-tighter">{selectedComplaint?.reference_number}</p>
              </div>
           </div>
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select Operator</label>
             <select 
               value={targetStaffId} 
               onChange={(e) => setTargetStaffId(e.target.value)}
               className="premium-input bg-slate-50 py-5"
             >
               <option value="">-- Institutional Staff Directory --</option>
               {staffList.map(s => (
                 <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role_name})</option>
               ))}
             </select>
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => setStatusModalOpen(false)} 
        title="Progression Enforcement"
        footer={
          <>
            <button onClick={() => setStatusModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
            <button 
              onClick={handleUpdateStatus} 
              disabled={!targetStatus || !remarks || submitting}
              className="px-10 py-4 bg-[#008540] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 disabled:bg-slate-200"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Shift"}
            </button>
          </>
        }
      >
        <div className="space-y-8">
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">State Transition</label>
             <select 
               value={targetStatus} 
               onChange={(e) => setTargetStatus(e.target.value)}
               className="premium-input bg-slate-50 py-5"
             >
               <option value="Under Review">Under Review</option>
               <option value="In Progress">In Progress</option>
               <option value="Resolved">Resolved</option>
               <option value="Rejected">Rejected</option>
             </select>
           </div>
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Auditable Log Entry</label>
             <textarea 
               value={remarks} 
               onChange={(e) => setRemarks(e.target.value)}
               placeholder="Technical justification for this state change..."
               rows={5}
               className="premium-input bg-slate-50 py-5 resize-none"
             />
           </div>
        </div>
      </Modal>
    </div>
  );
}
