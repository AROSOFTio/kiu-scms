import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader2, Route, Send } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ComplaintActivityTimeline,
  ComplaintStatusBadge,
  ROUTING_DESTINATIONS,
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
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  lecturer_first_name?: string;
  lecturer_last_name?: string;
  assigned_staff_id: number | null;
  assigned_staff_user_id: number | null;
  attachments: { id: number; file_path: string; file_name: string }[];
  timeline: TimelineEvent[];
}

interface StaffRecord {
  id: number;
  first_name: string;
  last_name: string;
  role_name: string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function ComplaintWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canRoute = user?.role === 'HOD';
  const backPath = canRoute ? '/dashboard/hod/complaints' : '/dashboard/lecturer';

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);

  const [statusForm, setStatusForm] = useState({ status: 'Received by HOD', remarks: '' });
  const [routeForm, setRouteForm] = useState({ destination: '', otherUnit: '', staffId: '' });

  const loadComplaint = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/complaints/${id}`);
      const data = response.data.data as ComplaintDetail;
      setComplaint(data);
      setStatusForm((current) => ({
        ...current,
        status: ['Submitted', 'Received by HOD', 'Assigned to Lecturer'].includes(data.display_status || data.status)
          ? 'Received by HOD'
          : (data.display_status || data.status),
      }));
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [id]);

  useEffect(() => {
    if (!canRoute) return;
    api.get('/admin/staff').then((response) => setStaffList(response.data.data || [])).catch(() => setStaffList([]));
  }, [canRoute]);

  const activityEntries = useMemo(
    () => (complaint?.timeline || []).map((event) => createStatusActivity(event)),
    [complaint?.timeline],
  );

  const canAccessComplaint = canRoute || complaint?.assigned_staff_user_id === user?.id;

  const handleStatusUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!statusForm.remarks.trim()) return;

    setSavingStatus(true);
    try {
      await api.patch(`/admin/complaints/${id}/status`, {
        status: statusForm.status,
        remarks: statusForm.remarks.trim(),
      });
      setStatusForm((current) => ({ ...current, remarks: '' }));
      await loadComplaint();
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRoute = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedOtherUnit = routeForm.otherUnit.trim();
    const requiresLecturer = routeForm.destination === 'Lecturer';
    const requiresOtherUnit = routeForm.destination === 'Other unit';

    if (
      !routeForm.destination
      || (requiresLecturer && !routeForm.staffId)
      || (requiresOtherUnit && !trimmedOtherUnit)
    ) {
      return;
    }

    setSavingRoute(true);
    try {
      await api.patch(`/admin/complaints/${id}/route`, {
        destination: routeForm.destination,
        otherUnit: requiresOtherUnit ? trimmedOtherUnit : undefined,
        staffId: requiresLecturer ? routeForm.staffId : undefined,
      });
      setRouteForm({ destination: '', otherUnit: '', staffId: '' });
      await loadComplaint();
    } finally {
      setSavingRoute(false);
    }
  };

  const handleRouteDestinationChange = (value: string) => {
    setRouteForm((current) => ({
      ...current,
      destination: value,
      otherUnit: value === 'Other unit' ? current.otherUnit : '',
      staffId: value === 'Lecturer' ? current.staffId : '',
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-[620px] w-full" />
      </div>
    );
  }

  if (!complaint) {
    return <div className="p-8 text-sm text-slate-500">Complaint not found.</div>;
  }

  if (!canAccessComplaint) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={Route}
          title="Not in your queue"
          description=""
          actionLabel="Open queue"
          actionLink={backPath}
        />
      </div>
    );
  }

  const currentStatus = complaint.display_status || complaint.status;
  const lecturerRoutingEnabled = routeForm.destination === 'Lecturer';
  const statusOptions = canRoute
    ? ['Received by HOD', 'Assigned to Lecturer', 'In Progress', 'Awaiting Student', 'Resolved', 'Closed', 'Rejected']
    : ['In Progress', 'Awaiting Student', 'Resolved'];

  return (
    <div className="space-y-5 pb-10">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(backPath)}
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

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Student</h2>
            <div className="mt-4 flex items-center gap-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
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

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Complaint details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Type</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.category_name}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Submitted</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(complaint.created_at)}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Assigned Lecturer</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {complaint.lecturer_first_name ? `${complaint.lecturer_first_name} ${complaint.lecturer_last_name}` : 'Not yet assigned'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Complaint narrative</h2>
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
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-3 transition hover:border-[#34b05a]/35"
                  >
                    <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#34b05a]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">{file.file_name}</span>
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
          {canRoute && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#34b05a]/10 text-[#34b05a]">
                  <Route className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Assignment</h2>
                  <p className="text-sm text-slate-500">Route this complaint to a lecturer in your department or another destination.</p>
                </div>
              </div>

              <form onSubmit={handleRoute} className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Forward to</label>
                  <select
                    value={routeForm.destination}
                    onChange={(event) => handleRouteDestinationChange(event.target.value)}
                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
                  >
                    <option value="">-- Select destination --</option>
                    {ROUTING_DESTINATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assign Lecturer</label>
                  <select
                    value={routeForm.staffId}
                    onChange={(event) => setRouteForm((current) => ({ ...current, staffId: event.target.value }))}
                    disabled={!lecturerRoutingEnabled}
                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select lecturer</option>
                    {staffList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.first_name} {item.last_name} ({item.role_name})
                      </option>
                    ))}
                  </select>
                </div>

                {routeForm.destination === 'Other unit' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Other unit</label>
                    <input
                      value={routeForm.otherUnit}
                      onChange={(event) => setRouteForm((current) => ({ ...current, otherUnit: event.target.value }))}
                      placeholder="Enter office or unit"
                      className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={!routeForm.destination || (routeForm.destination === 'Lecturer' && !routeForm.staffId) || (routeForm.destination === 'Other unit' && !routeForm.otherUnit.trim()) || savingRoute}
                    className="inline-flex items-center gap-2 rounded-[16px] bg-[#34b05a] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#2d9a4e] disabled:opacity-50"
                  >
                    {savingRoute ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
                    Send route
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <h2 className="text-sm font-semibold text-slate-900">Status update</h2>
            <p className="mt-1 text-sm text-slate-500">Move the complaint through the next stage and record the action taken.</p>

            <form onSubmit={handleStatusUpdate} className="mt-5 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Action note</label>
                <textarea
                  value={statusForm.remarks}
                  onChange={(event) => setStatusForm((current) => ({ ...current, remarks: event.target.value }))}
                  rows={4}
                  placeholder="Describe the action or outcome"
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!statusForm.remarks.trim() || savingStatus}
                  className="inline-flex items-center gap-2 rounded-[16px] bg-[#292929] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1f1f1f] disabled:opacity-50"
                >
                  {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save update
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Activity timeline</h2>
                <p className="mt-1 text-sm text-slate-500">Submitted, reviewed, routed, updated, and resolved actions.</p>
              </div>
              <ComplaintStatusBadge status={currentStatus} />
            </div>

            <div className="mt-6">
              <ComplaintActivityTimeline entries={activityEntries} />
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
