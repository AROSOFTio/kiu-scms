import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Download, FileText } from 'lucide-react';
import api from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import FeedbackForm from '../../components/complaints/FeedbackForm';
import {
  ComplaintActivityTimeline,
  ComplaintStatusBadge,
  createStatusActivity,
} from '../../components/complaints/ComplaintLifecycle';

interface TimelineEvent {
  id: number;
  status: string;
  remarks: string;
  changed_at: string;
  first_name?: string;
  last_name?: string;
}

interface ComplaintDetail {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: string;
  display_status?: string;
  category_name: string;
  created_at: string;
  attachments: { id: number; file_path: string; file_name?: string }[];
  timeline: TimelineEvent[];
  feedback?: { rating: number; comments: string };
}

export default function StudentComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/complaints/${id}`);
        setComplaint(response.data.data);
      } catch {
        setError('Failed to load complaint details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const activityEntries = useMemo(
    () => (complaint?.timeline || []).map((event) => createStatusActivity(event)),
    [complaint?.timeline],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-[720px] w-full" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-6">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h2 className="text-xl font-semibold text-rose-900">Access unavailable</h2>
          <p className="mt-2 text-sm text-rose-700">{error || 'Complaint not found.'}</p>
          <button
            onClick={() => navigate('/dashboard/student/complaints')}
            className="mt-6 rounded-[16px] bg-white px-5 py-3 text-sm font-semibold text-rose-700 shadow-sm"
          >
            Back to complaints
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = complaint.display_status || complaint.status;

  return (
    <div className="space-y-5 pb-10">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/student/complaints')}
            className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{complaint.reference_number}</p>
            <h1 className="truncate text-2xl font-semibold text-slate-900">{complaint.title}</h1>
          </div>
        </div>
        <ComplaintStatusBadge status={currentStatus} className="text-xs" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Complaint summary</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Type</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.category_name}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Filed on</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {new Date(complaint.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Current status</p>
                <div className="mt-2">
                  <ComplaintStatusBadge status={currentStatus} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</h2>
            <div className="mt-4 whitespace-pre-wrap rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {complaint.description}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Attachments</h2>
            <div className="mt-4 space-y-2">
              {complaint.attachments.length ? (
                complaint.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-3 transition hover:border-[#34b05a]/35"
                  >
                    <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#34b05a]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                      {file.file_name || file.file_path.split('/').pop()}
                    </span>
                    <Download className="h-3.5 w-3.5 text-slate-300" />
                  </a>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No attachments
                </div>
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Activity timeline</h2>
                <p className="mt-1 text-sm text-slate-500">Submission, review, routing, updates, and resolution history.</p>
              </div>
              <ComplaintStatusBadge status={currentStatus} />
            </div>

            <div className="mt-6">
              <ComplaintActivityTimeline entries={activityEntries} />
            </div>
          </section>

          {(currentStatus === 'Resolved' || currentStatus === 'Closed') && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
              <h2 className="text-sm font-semibold text-slate-900">Feedback</h2>
              <p className="mt-1 text-sm text-slate-500">Rate the outcome and leave a short comment.</p>
              <div className="mt-5">
                <FeedbackForm complaintId={id!} existingFeedback={complaint.feedback} onSuccess={() => {}} />
              </div>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
