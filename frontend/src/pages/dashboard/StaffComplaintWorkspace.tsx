import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  MessageSquare,
  Copy,
  Check,
  MoreVertical,
  Send,
  UserPlus,
  History,
  Lock,
  Loader2
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

interface TimelineEvent {
  id: number;
  status: string;
  remarks: string;
  created_at: string;
  created_by_name: string;
}

interface InternalNote {
  id: number;
  note: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

interface ComplaintDetail {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category_name: string;
  created_at: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  assigned_staff_id: number;
  attachments: { id: number; file_path: string; file_name: string }[];
  timeline: TimelineEvent[];
  feedback?: { rating: number; comments: string; date: string } | null;
}

export default function StaffComplaintWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'reassign'>('timeline');
  
  // Forms
  const [statusUpdate, setStatusUpdate] = useState({ status: '', remarks: '' });
  const [newNote, setNewNote] = useState('');
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/admin/complaints/${id}`);
      setComplaint(res.data.data);
      setStatusUpdate({ status: res.data.data.status, remarks: '' });
    } catch (err) {
      // Error
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/admin/complaints/${id}/notes`);
      setInternalNotes(res.data.data);
    } catch (err) {}
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      setStaffList(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDetail();
    fetchNotes();
    fetchStaff();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${id}/status`, statusUpdate);
      await fetchDetail();
      setStatusUpdate(prev => ({ ...prev, remarks: '' }));
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/complaints/${id}/notes`, { note: newNote });
      await fetchNotes();
      setNewNote('');
    } catch (err) {
      alert('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${id}/assign`, { staffId: selectedStaff });
      await fetchDetail();
      alert('Case reassigned successfully');
    } catch (err) {
      alert('Failed to reassign case');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'Submitted': return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, border: 'border-blue-200' };
      case 'Under Review': return { color: 'text-indigo-600', bg: 'bg-indigo-50', icon: MessageSquare, border: 'border-indigo-200' };
      case 'In Progress': return { color: 'text-amber-600', bg: 'bg-amber-50', icon: MoreVertical, border: 'border-amber-200' };
      case 'Resolved': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, border: 'border-emerald-200' };
      case 'Rejected': return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, border: 'border-red-200' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock, border: 'border-gray-200' };
    }
  };

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!complaint) return <div>Complaint not found.</div>;

  const statusCfg = getStatusConfig(complaint.status);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500 text-gray-800">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div className="h-8 w-[1px] bg-gray-100" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{complaint.reference_number}</span>
              <button onClick={() => copyToClipboard(complaint.reference_number)} className="hover:text-primary-600">
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate max-w-md">{complaint.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
            {complaint.status}
          </div>
          <select 
            value={statusUpdate.status}
            onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
            className="bg-gray-50 border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[#008540] transition-all"
          >
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Student">Awaiting Student</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Workspace Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Case Info */}
        <div className="w-[450px] border-r border-gray-100 bg-white overflow-y-auto p-6 space-y-8 flex-shrink-0">
          
          {/* Feedback Display */}
          {complaint.status === 'Resolved' && complaint.feedback && (
            <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl shadow-sm">
              <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> Student Feedback
              </h2>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`h-4 w-4 ${star <= complaint.feedback!.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
                <span className="ml-2 text-xs font-bold text-gray-700">{complaint.feedback.rating}.0 / 5.0</span>
              </div>
              {complaint.feedback.comments && (
                <p className="text-sm text-gray-600 italic">"{complaint.feedback.comments}"</p>
              )}
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Student Identity</h2>
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black text-lg">
                {complaint.student_first_name[0]}{complaint.student_last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="font-black text-gray-900 uppercase text-xs truncate">{complaint.student_first_name} {complaint.student_last_name}</p>
                <p className="text-[10px] text-gray-500 font-bold truncate">{complaint.student_email}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Grievance Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Priority</p>
                  <p className="text-xs font-bold text-gray-800">{complaint.priority}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Filed On</p>
                  <p className="text-xs font-bold text-gray-800">{new Date(complaint.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">"{complaint.description}"</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Supporting Documents</h2>
            {complaint.attachments.length === 0 ? (
               <p className="text-xs text-gray-400 font-medium">No attachments provided.</p>
            ) : (
              <div className="space-y-2">
                {complaint.attachments.map(file => (
                  <a key={file.id} href={`/api/uploads/${file.file_path}`} target="_blank" className="flex items-center p-3 bg-white border border-gray-100 rounded-lg hover:border-[#008540] hover:shadow-sm transition-all group">
                    <FileText className="h-4 w-4 mr-3 text-gray-400 group-hover:text-[#008540]" />
                    <span className="text-[10px] font-bold text-gray-700 truncate flex-1">{file.file_name}</span>
                    <Download className="h-3 w-3 text-gray-300" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Narrative & Workspace */}
        <div className="flex-1 bg-gray-50/30 flex flex-col overflow-hidden">
          {/* Workspace Tabs */}
          <div className="bg-white border-b border-gray-100 px-6 flex items-center gap-8">
             {[
               { id: 'timeline', label: 'Resolution Timeline', icon: History },
               { id: 'notes', label: 'Internal Workspace', icon: Lock },
               { id: 'reassign', label: 'Collaboration', icon: UserPlus },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                   activeTab === tab.id ? 'border-[#008540] text-[#008540]' : 'border-transparent text-gray-400 hover:text-gray-600'
                 }`}
               >
                 <tab.icon className="h-3.5 w-3.5" />
                 {tab.label}
               </button>
             ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'timeline' && (
              <div className="max-w-2xl mx-auto space-y-8">
                {complaint.timeline.map(event => (
                  <div key={event.id} className="relative pl-8 border-l-2 border-gray-100 pb-8 last:pb-0">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 bg-white border-2 border-primary-500 rounded-full" />
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">{event.status}</span>
                        <span className="text-[9px] text-gray-400 font-bold">{new Date(event.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">"{event.remarks}"</p>
                      <p className="text-[10px] text-gray-400 mt-4 font-black uppercase tracking-tighter">— {event.created_by_name}</p>
                    </div>
                  </div>
                ))}

                {/* Status Update Form */}
                <div className="mt-8 bg-white p-6 rounded-2xl border border-[#008540]/20 shadow-lg shadow-[#008540]/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-[#008540]/5 rounded-bl-full -mr-12 -mt-12" />
                   <h3 className="text-xs font-black text-[#008540] uppercase tracking-[0.2em] mb-4">Official Status Action</h3>
                   <form onSubmit={handleUpdateStatus} className="space-y-4">
                      <textarea 
                        required
                        placeholder="Add professional remarks for the student to see along with this status change..."
                        value={statusUpdate.remarks}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, remarks: e.target.value }))}
                        className="w-full bg-gray-50/50 border-gray-100 rounded-xl p-4 text-xs font-bold focus:ring-[#008540] min-h-[100px]"
                      />
                      <button 
                        disabled={submitting || !statusUpdate.remarks}
                        className="w-full py-3 bg-[#008540] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                      >
                         {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Post Public Update <Send className="ml-2 h-3.5 w-3.5" /></>}
                      </button>
                   </form>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="max-w-2xl mx-auto space-y-8">
                 <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-center gap-3 mb-8">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tighter">Internal Workspace: Notes are visible only to Staff and Admin users.</p>
                 </div>

                 {/* New Note Form */}
                 <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative mb-12">
                   <textarea 
                     placeholder="Type individual observations, call logs, or private coordination details..."
                     value={newNote}
                     onChange={(e) => setNewNote(e.target.value)}
                     className="w-full border-none rounded-xl p-4 h-24 text-xs font-bold focus:ring-0"
                   />
                   <div className="flex justify-end p-2">
                     <button 
                        onClick={handleAddNote}
                        disabled={submitting || !newNote.trim()}
                        className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                     >
                       <Send className="h-4 w-4" />
                     </button>
                   </div>
                 </div>

                 <div className="space-y-6">
                    {internalNotes.length === 0 ? (
                       <div className="py-12 text-center text-gray-400">No internal notes added yet.</div>
                    ) : internalNotes.map(note => (
                       <div key={note.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-12 h-1 text-gray-100 bg-gray-50" />
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                                   {note.first_name[0]}{note.last_name[0]}
                                </div>
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{note.first_name} {note.last_name}</span>
                             </div>
                             <span className="text-[9px] text-gray-400 font-bold">{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed">{note.note}</p>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'reassign' && (
               <div className="max-w-md mx-auto py-12 text-center space-y-8">
                  <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <UserPlus className="h-10 w-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Handover Case</h3>
                    <p className="text-sm text-gray-500 font-medium mt-2">Reassign this grievance to a different department or staff member for specialized handling.</p>
                  </div>

                  <div className="space-y-4">
                     <select 
                       value={selectedStaff}
                       onChange={(e) => setSelectedStaff(e.target.value)}
                       className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#008540]"
                     >
                        <option value="">Select Target Staff...</option>
                        {staffList.filter(s => s.id !== complaint.assigned_staff_id).map(s => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role_name})</option>
                        ))}
                     </select>
                     <button 
                       onClick={handleReassign}
                       disabled={submitting || !selectedStaff}
                       className="w-full py-4 bg-[#008540] text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
                     >
                       Confirm Reassignment
                     </button>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
