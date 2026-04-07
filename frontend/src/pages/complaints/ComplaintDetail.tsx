import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  User, 
  Calendar,
  MessageSquare,
  Copy,
  Check,
  MoreVertical
} from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import FeedbackForm from '../../components/complaints/FeedbackForm';

interface TimelineEvent {
  id: number;
  status: string;
  remarks: string;
  created_at: string;
  created_by_name: string;
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
  attachments: { id: number; file_path: string; file_name: string }[];
  timeline: TimelineEvent[];
  feedback?: { rating: number; comments: string };
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data.data);
      } catch (err: any) {
        setError('Failed to load complaint details. It might have been deleted or you lack permissions.');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchDetail();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-6 w-24" />
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-4 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-2/3" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
            {[1, 2, 3, 4].map(i => <div key={i}><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-5 w-24" /></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
           <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-red-900 mb-2 font-black tracking-tight">Access Denied</h2>
           <p className="text-red-700 font-medium mb-6">{error || 'Complaint not found or access restricted.'}</p>
           <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white text-red-700 rounded-lg font-bold shadow-sm hover:shadow-md transition-all border border-red-100">Back to List</button>
        </div>
      </div>
    );
  }

  const currentStatus = getStatusConfig(complaint.status);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="group flex items-center text-gray-500 hover:text-gray-900 transition-all font-bold text-sm tracking-tight"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Records
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50/50 bg-gray-50/20 text-gray-800">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Reference ID</span>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-sm group">
                  <span className="text-sm font-bold text-gray-700 mr-2">{complaint.reference_number}</span>
                  <button 
                    onClick={() => copyToClipboard(complaint.reference_number)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight max-w-2xl">{complaint.title}</h1>
            </div>
            <div className={`flex items-center px-6 py-2.5 rounded-full border-2 ${currentStatus.border} ${currentStatus.bg} ${currentStatus.color} shadow-sm active:scale-95 transition-transform`}>
              <currentStatus.icon className="h-5 w-5 mr-2.5" />
              <span className="text-sm font-black uppercase tracking-wider">{complaint.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 mt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><Calendar className="h-3 w-3 mr-1.5" /> Filed Date</p>
              <p className="text-sm font-bold text-gray-800">{new Date(complaint.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><FileText className="h-3 w-3 mr-1.5" /> Category</p>
              <p className="text-sm font-bold text-gray-800">{complaint.category_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><AlertCircle className="h-3 w-3 mr-1.5" /> Priority</p>
              <div className="flex items-center">
                 <span className={`h-2 w-2 rounded-full mr-2 ${
                   complaint.priority === 'Critical' ? 'bg-red-500' : 
                   complaint.priority === 'High' ? 'bg-amber-500' : 'bg-blue-500'
                 }`} />
                 <p className="text-sm font-bold text-gray-800">{complaint.priority}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><User className="h-3 w-3 mr-1.5" /> Reporter</p>
              <p className="text-sm font-bold text-gray-800 truncate">Student (Me)</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10 text-gray-800">
          {/* Detailed Description */}
          <section className="space-y-4 text-gray-800">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              Description 
              <div className="h-[2px] flex-1 bg-gray-50 ml-4" />
            </h2>
            <div className="bg-gray-50/50 p-6 rounded-2xl text-gray-700 leading-relaxed font-bold border border-gray-100 whitespace-pre-wrap">
              {complaint.description}
            </div>
          </section>

          {/* Attachments */}
          {complaint.attachments.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
                Supporting Documents
                <div className="h-[2px] flex-1 bg-gray-50 ml-4" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {complaint.attachments.map((file: { id: number; file_path: string; file_name: string }) => (
                  <a 
                    key={file.id}
                    href={`/api/uploads/${file.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-[#008540] hover:shadow-md transition-all group"
                  >
                    <div className="bg-gray-50 p-3 rounded-lg mr-4 group-hover:bg-[#008540]/10 transition-colors">
                      <FileText className="h-6 w-6 text-gray-400 group-hover:text-[#008540]" />
                    </div>
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-bold text-gray-800 truncate">{file.file_name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black mt-0.5 tracking-tighter">Click to view</p>
                    </div>
                    <Download className="h-4 w-4 text-gray-300 group-hover:text-[#008540]" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Feedback Section (If Resolved/Closed) */}
          {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
            <section className="space-y-4 pt-4">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-4">
                Feedback
                <div className="h-[2px] flex-1 bg-gray-50" />
              </h2>
              <FeedbackForm 
                complaintId={id!} 
                existingFeedback={complaint.feedback}
                onSuccess={() => {
                  // Optionally refresh or just let the form handle the success state
                }} 
              />
            </section>
          )}

          {/* Timeline View */}
          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              Case Progression
              <div className="h-[2px] flex-1 bg-gray-50 ml-4" />
            </h2>
            <div className="relative pt-6">
              <div className="absolute left-[27px] top-4 bottom-4 w-[3px] bg-gradient-to-b from-blue-100 via-gray-100 to-gray-50 rounded-full" />
              <div className="space-y-12 text-gray-800">
                {complaint.timeline.map((event: TimelineEvent) => {
                  const config = getStatusConfig(event.status);
                  return (
                    <div key={event.id} className="relative pl-16 group text-gray-800">
                      <div className={`absolute left-0 p-2.5 rounded-2xl z-10 shadow-sm border-2 ${config.border} ${config.bg} ${config.color} group-hover:scale-110 transition-transform duration-300`}>
                        <config.icon className="h-5 w-5" />
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all relative">
                        <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-[-45deg]" />
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                            {event.status}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm font-bold leading-relaxed">{event.remarks}</p>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-xs text-gray-400 font-medium">
                          <User className="h-3 w-3 mr-1.5" /> 
                          Actioned by: <span className="text-gray-600 font-black ml-1 uppercase tracking-tighter">{event.created_by_name || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
