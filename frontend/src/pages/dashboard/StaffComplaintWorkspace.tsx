import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  History,
  Loader2,
  Lock,
  Send,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/ui/EmptyState';
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
  assigned_staff_id: number | null;
  attachments: { id: number; file_path: string; file_name: string }[];
  timeline: TimelineEvent[];
  feedback?: { rating: number; comments: string; date: string } | null;
}

type TabKey = 'timeline' | 'notes';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function getStatusLabel(status: string) {
  if (status === 'Submitted' || status === 'Under Review') return 'Pending';
  if (status === 'Closed') return 'Resolved';
  return status;
}

function getStatusTone(status: string) {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return 'bg-[#34b05a]/12 text-[#2d8f49] border-[#34b05a]/15';
    case 'Awaiting Student':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'In Progress':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-white text-slate-700 border-slate-200';
  }
}

export default function StaffComplaintWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');
  const [statusUpdate, setStatusUpdate] = useState({ status: 'In Progress', remarks: '' });
  const [newNote, setNewNote] = useState('');
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/admin/complaints/${id}`);
      const detail = res.data.data as ComplaintDetail;
      setComplaint(detail);
      setStatusUpdate({ status: detail.status === 'Resolved' || detail.status === 'Closed' ? 'Resolved' : detail.status === 'Awaiting Student' ? 'Awaiting Student' : detail.status === 'In Progress' ? 'In Progress' : 'Under Review', remarks: '' });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/admin/complaints/${id}/notes`);
      setInternalNotes(res.data.data || []);
    } catch {
      setInternalNotes([]);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchNotes();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleUpdateStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!statusUpdate.remarks.trim()) return;

    setSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${id}/status`, {
        status: statusUpdate.status,
        remarks: statusUpdate.remarks.trim(),
      });
      await fetchDetail();
      setStatusUpdate((current) => ({ ...current, remarks: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/admin/complaints/${id}/notes`, { note: newNote.trim() });
      await fetchNotes();
      setNewNote('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-[560px] w-full" />
      </div>
    );
  }

  if (!complaint) {
    return <div className="p-8 text-sm text-slate-500">Complaint not found.</div>;
  }

  if (!complaint.assigned_staff_id || complaint.assigned_staff_id !== user?.id) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={Lock}
          title="Not in your queue"
          description=""
          actionLabel="Open queue"
          actionLink="/dashboard/staff"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/staff')}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {complaint.reference_number}
              </span>
              <button onClick={() => copyToClipboard(complaint.reference_number)} className="text-slate-400 transition hover:text-[#34b05a]">
                {copied ? <Check className="h-3.5 w-3.5 text-[#34b05a]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <h1 className="truncate text-xl font-semibold text-slate-900">{complaint.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(getStatusLabel(complaint.status))}`}>
            {getStatusLabel(complaint.status)}
          </span>
          <select
            value={statusUpdate.status}
            onChange={(event) => setStatusUpdate((current) => ({ ...current, status: event.target.value }))}
            className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] outline-none focus:ring-2 focus:ring-[#34b05a]"
          >
            <option value="Under Review">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Student">Awaiting Student</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[410px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6">
          <div className="space-y-8">
            {complaint.feedback && getStatusLabel(complaint.status) === 'Resolved' && (
              <section className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-4">
                <h2 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Feedback
                </h2>
                <p className="text-sm font-medium text-slate-900">{complaint.feedback.rating}.0 / 5.0</p>
                {complaint.feedback.comments && <p className="mt-2 text-sm text-slate-600">{complaint.feedback.comments}</p>}
              </section>
            )}

            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Student</h2>
              <div className="flex items-center gap-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#34b05a]/10 text-sm font-semibold text-[#34b05a]">
                  {complaint.student_first_name[0]}{complaint.student_last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {complaint.student_first_name} {complaint.student_last_name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{complaint.student_email}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{complaint.category_name}</p>
                </div>
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(complaint.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{complaint.description}</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Attachments</h2>
              {complaint.attachments.length ? (
                <div className="space-y-2">
                  {complaint.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-3 transition hover:border-[#34b05a]/35"
                    >
                      <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#34b05a]" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">{file.file_name}</span>
                      <Download className="h-3.5 w-3.5 text-slate-300" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No attachments
                </div>
              )}
            </section>
          </div>
        </aside>

        <section className="flex flex-1 flex-col overflow-hidden bg-slate-50/60">
          <div className="flex items-center gap-8 border-b border-slate-200 bg-white px-6">
            {[
              { id: 'timeline', label: 'History', icon: History },
              { id: 'notes', label: 'Notes', icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex items-center gap-2 border-b-2 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  activeTab === tab.id ? 'border-[#34b05a] text-[#34b05a]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'timeline' && (
              <div className="mx-auto max-w-2xl space-y-8">
                {complaint.timeline.map((event) => (
                  <div key={event.id} className="relative border-l-2 border-slate-200 pb-8 pl-8 last:pb-0">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-[#34b05a] bg-white" />
                    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusTone(getStatusLabel(event.status))}`}>
                          {getStatusLabel(event.status)}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(event.created_at)}</span>
                      </div>
                      <p className="text-sm leading-7 text-slate-800">{event.remarks}</p>
                      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{event.created_by_name}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-[20px] border border-[#34b05a]/20 bg-white p-6 shadow-lg shadow-[#34b05a]/5">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#34b05a]">Post update</h3>
                  <form onSubmit={handleUpdateStatus} className="space-y-4">
                    <textarea
                      required
                      placeholder="Action update"
                      value={statusUpdate.remarks}
                      onChange={(event) => setStatusUpdate((current) => ({ ...current, remarks: event.target.value }))}
                      className="min-h-[110px] w-full rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-[#34b05a]"
                    />
                    <button
                      disabled={submitting || !statusUpdate.remarks.trim()}
                      className="flex w-full items-center justify-center rounded-[16px] bg-[#34b05a] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#2d9a4e] disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save update <Send className="ml-2 h-3.5 w-3.5" /></>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="mx-auto max-w-2xl space-y-8">
                <div className="flex items-center gap-3 rounded-[16px] border border-amber-100 bg-amber-50 px-4 py-3">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <p className="text-[11px] font-medium text-amber-700">Internal only.</p>
                </div>

                <form onSubmit={handleAddNote} className="rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
                  <textarea
                    placeholder="Add note"
                    value={newNote}
                    onChange={(event) => setNewNote(event.target.value)}
                    className="h-24 w-full rounded-xl border-none p-4 text-sm outline-none focus:ring-0"
                  />
                  <div className="flex justify-end p-2">
                    <button
                      type="submit"
                      disabled={submitting || !newNote.trim()}
                      className="rounded-[14px] bg-[#292929] p-3 text-white transition active:scale-95 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                <div className="space-y-5">
                  {internalNotes.length ? (
                    internalNotes.map((note) => (
                      <div key={note.id} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                              {note.first_name[0]}{note.last_name[0]}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-900">{note.first_name} {note.last_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{formatDateTime(note.created_at)}</span>
                        </div>
                        <p className="text-sm leading-7 text-slate-700">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No notes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
