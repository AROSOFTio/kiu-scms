import { 
  Search, 
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { TableRowSkeleton } from '../../components/ui/Skeleton';

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
  const isAdmin = user?.role === 'Admin';
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        const params = { search, status, priority, page, limit };
        const res = await api.get('/admin/complaints', { params });
        setComplaints(res.data.data);
        setTotal(res.data.total);
      } catch (err) {
        // Error handling
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, status, priority, page]);

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
      // Reload complaints
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
      // Reload
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
      case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
      case 'In Progress': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Under Review': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Grievance Records</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Administrative view of all institutional complaints.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search reference, title or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008540] transition-all text-sm font-bold text-gray-800"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-black text-gray-800 focus:ring-2 focus:ring-[#008540] transition-all"
          >
            <option value="">Status: All</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-black text-gray-800 focus:ring-2 focus:ring-[#008540] transition-all"
          >
            <option value="">Priority: All</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Case Info</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Status & Priority</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center text-gray-400 italic">No grievances matching your criteria.</td>
                </tr>
              ) : complaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-black text-gray-800 bg-gray-100 px-2 py-1 rounded text-[10px] tracking-wider">{c.reference_number}</span>
                  </td>
                  <td className="px-6 py-5 text-gray-800">
                    <p className="font-black text-sm uppercase truncate max-w-[120px]">{c.student_first_name} {c.student_last_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold truncate">Student</p>
                  </td>
                  <td className="px-6 py-5 max-w-[200px]">
                    <p className="font-bold text-sm text-gray-900 group-hover:text-[#008540] transition-colors truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{c.category_name}</p>
                  </td>
                  <td className="px-6 py-5">
                    {c.staff_first_name ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-2">
                           <User className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{c.staff_first_name} {c.staff_last_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col space-y-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border -ml-1 w-fit ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                      <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                         <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                           c.priority === 'Critical' ? 'bg-red-500 animate-pulse' : 
                           c.priority === 'High' ? 'bg-amber-500' : 'bg-blue-500'
                         }`} />
                         {c.priority} Priority
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {isAdmin && (
                        <button 
                          onClick={() => { setSelectedComplaint(c); setAssignModalOpen(true); }}
                          title="Assign Staff" 
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <UserPlus className="h-5 w-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedComplaint(c); setTargetStatus(c.status); setStatusModalOpen(true); }}
                        title="Update Status" 
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between p-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Page {page} of {Math.ceil(total / limit)}
          </p>
          <div className="flex gap-4">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-6 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black shadow-sm disabled:opacity-50 transition-all hover:shadow-md"
            >
              Previous
            </button>
            <button 
              disabled={page * limit >= total} 
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 bg-[#008540] text-white rounded-xl text-xs font-black shadow-sm disabled:opacity-50 transition-all hover:shadow-lg active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setAssignModalOpen(false)} 
        title="Delegate Responsibility"
        footer={
          <>
            <button onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
            <button 
              onClick={handleAssign} 
              disabled={!targetStaffId || submitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black flex items-center shadow-md disabled:bg-indigo-300"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Assign Now
            </button>
          </>
        }
      >
        <div className="space-y-4">
           <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-indigo-900 uppercase tracking-tighter">Case Reference</p>
                <p className="text-sm text-indigo-700 font-bold">{selectedComplaint?.reference_number}</p>
              </div>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Select Staff Member</label>
             <select 
               value={targetStaffId} 
               onChange={(e) => setTargetStaffId(e.target.value)}
               className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all"
             >
               <option value="">-- Choose Operator --</option>
               {staffList.map(s => (
                 <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role_name})</option>
               ))}
             </select>
           </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => setStatusModalOpen(false)} 
        title="Update Progression"
        footer={
          <>
            <button onClick={() => setStatusModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
            <button 
              onClick={handleUpdateStatus} 
              disabled={!targetStatus || !remarks || submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black flex items-center shadow-md disabled:bg-emerald-300"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Enforce Update
            </button>
          </>
        }
      >
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">New Resolution Status</label>
             <select 
               value={targetStatus} 
               onChange={(e) => setTargetStatus(e.target.value)}
               className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all"
             >
               <option value="Under Review">Under Review</option>
               <option value="In Progress">In Progress</option>
               <option value="Resolved">Resolved</option>
               <option value="Rejected">Rejected</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Log Remarks (Auditable)</label>
             <textarea 
               value={remarks} 
               onChange={(e) => setRemarks(e.target.value)}
               placeholder="Briefly explain the progression or decision..."
               rows={4}
               className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
             />
           </div>
        </div>
      </Modal>
    </div>
  );
}
