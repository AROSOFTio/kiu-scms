import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw, Route, Search } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ComplaintStatusBadge,
  LIFECYCLE_STATUSES,
  ROUTING_DESTINATIONS,
} from '../../components/complaints/ComplaintLifecycle';

interface ComplaintRecord {
  id: number;
  reference_number: string;
  title: string;
  status: string;
  display_status?: string;
  category_name: string;
  created_at: string;
  student_first_name: string;
  student_last_name: string;
  staff_first_name?: string;
  staff_last_name?: string;
}

interface StaffRecord {
  id: number;
  first_name: string;
  last_name: string;
  role_name: string;
}

interface CategoryRecord {
  id: number;
  name: string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function ComplaintQueue() {
  const { user } = useAuth();
  const location = useLocation();
  const isHOD = user?.role === 'HOD' || user?.role === 'SuperAdmin';
  const isLecturer = user?.role === 'Lecturer';
  const canRoute = isHOD;
  const isAssignedQueue = location.pathname.includes('/lecturer');
  const detailBasePath = isHOD ? '/dashboard/hod/complaints' : '/dashboard/lecturer/complaints';

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [isRouteModalOpen, setRouteModalOpen] = useState(false);
  const [targetUnit, setTargetUnit] = useState('');
  const [otherUnit, setOtherUnit] = useState('');
  const [targetStaffId, setTargetStaffId] = useState('');
  const [routingNote, setRoutingNote] = useState('');

  const currentStatuses = useMemo(
    () => complaints.reduce<Record<string, number>>((acc, complaint) => {
      const key = complaint.display_status || complaint.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    [complaints],
  );

  const loadQueue = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (category) params.category = category;
      // Lecturers automatically get only their assigned complaints (backend scope)

      const response = await api.get('/admin/complaints', { params });
      setComplaints(response.data.data || []);
      setTotal(Number(response.data.total || 0));
    } catch {
      setComplaints([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadQueue, 250);
    return () => window.clearTimeout(timer);
  }, [search, status, category, page, isHOD, isLecturer]);

  useEffect(() => {
    setPage(1);
  }, [search, status, category]);

  useEffect(() => {
    if (!canRoute) return;

    api.get('/admin/staff').then((response) => setStaffList(response.data.data || [])).catch(() => setStaffList([]));
  }, [canRoute]);

  useEffect(() => {
    api.get('/admin/categories').then((response) => setCategories(response.data.data || [])).catch(() => setCategories([]));
  }, []);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    setPage(1);
  };

  const openRouteModal = (complaint: ComplaintRecord) => {
    setSelectedComplaint(complaint);
    setTargetUnit('');
    setOtherUnit('');
    setTargetStaffId('');
    setRoutingNote('');
    setRouteModalOpen(true);
  };

  const handleRouteComplaint = async () => {
    if (!selectedComplaint || !targetUnit) return;

    setSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${selectedComplaint.id}/route`, {
        destination: targetUnit,
        otherUnit: targetUnit === 'Other unit' ? otherUnit.trim() : undefined,
        staffId: targetStaffId || undefined,
        remarks: routingNote.trim() || undefined,
      });
      setRouteModalOpen(false);
      await loadQueue();
    } catch {
      alert('Failed to route complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#34b05a]">
              {isHOD ? 'HOD Complaint Queue' : 'Assigned Queue'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              {isHOD ? 'Department Complaint Queue' : 'My Assigned Complaints'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isHOD ? 'Review, assign to lecturers, and monitor department complaint progress.' : 'Work through complaints assigned to you by the HOD.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total', value: complaints.length },
              { label: 'Pending HOD', value: (currentStatuses['Received by HOD'] || 0) + (currentStatuses.Submitted || 0) },
              { label: 'Assigned', value: currentStatuses['Assigned to Lecturer'] || 0 },
              { label: 'Resolved', value: (currentStatuses.Resolved || 0) + (currentStatuses.Closed || 0) },
            ].map((card) => (
              <div key={card.label} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ref, title, or student"
              className="w-full rounded-[16px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
          >
            <option value="">All statuses</option>
            {LIFECYCLE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
          >
            <option value="">All types</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:border-[#34b05a]/25 hover:text-[#34b05a]"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
        <div className="hidden grid-cols-[150px_180px_minmax(0,1fr)_200px_160px_120px] gap-4 border-b border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 xl:grid">
          <span>Ref No</span>
          <span>Student</span>
          <span>Complaint</span>
          <span>Assigned Lecturer</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#34b05a]" />
            </div>
          ) : complaints.length ? (
            complaints.map((complaint) => {
              const currentStatus = complaint.display_status || complaint.status;
              const assignedLabel = complaint.lecturer_first_name ? `${complaint.lecturer_first_name} ${complaint.lecturer_last_name}` : 'Unassigned';

              return (
                <div
                  key={complaint.id}
                  className="grid gap-4 px-6 py-5 transition hover:bg-slate-50 xl:grid-cols-[150px_180px_minmax(0,1fr)_200px_160px_120px] xl:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900">{complaint.reference_number}</p>
                    <p className="mt-1 text-xs text-slate-400 xl:hidden">{formatDate(complaint.created_at)}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {complaint.student_first_name} {complaint.student_last_name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">{formatDate(complaint.created_at)}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{complaint.title}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{complaint.category_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-700">{assignedLabel}</p>
                  </div>

                  <div>
                    <ComplaintStatusBadge status={currentStatus} />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {isHOD && (
                      <button
                        type="button"
                        onClick={() => openRouteModal(complaint)}
                        className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#34b05a]/25 hover:text-[#34b05a]"
                      >
                        <Route className="h-3.5 w-3.5" />
                        Assign
                      </button>
                    )}
                    <Link
                      to={`${detailBasePath}/${complaint.id}`}
                      className="inline-flex items-center gap-2 rounded-[14px] bg-[#34b05a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2d9a4e]"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8">
              <EmptyState
                icon={Route}
                title="No complaints"
                description=""
              />
            </div>
          )}
        </div>
      </section>

      {total > limit && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-400">
            Page {page} of {Math.ceil(total / limit)}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-[14px] border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#34b05a]/25 hover:text-[#34b05a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page * limit >= total}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-[14px] bg-[#34b05a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2d9a4e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isRouteModalOpen}
        onClose={() => setRouteModalOpen(false)}
        title="Assign Complaint to Lecturer"
        footer={
          <>
            <button onClick={() => setRouteModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
              Cancel
            </button>
            <button
              onClick={handleRouteComplaint}
              disabled={!targetUnit || (targetUnit === 'Other unit' && !otherUnit.trim()) || submitting}
              className="px-8 py-3 bg-[#34b05a] text-white rounded-2xl text-xs font-semibold uppercase tracking-[0.16em] disabled:bg-slate-200"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save route'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Complaint</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedComplaint?.reference_number}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedComplaint?.title}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assign destination</label>
            <select
              value={targetUnit}
              onChange={(event) => setTargetUnit(event.target.value)}
              className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
            >
              <option value="">Select unit</option>
              {ROUTING_DESTINATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {targetUnit === 'Other unit' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Other unit</label>
              <input
                value={otherUnit}
                onChange={(event) => setOtherUnit(event.target.value)}
                placeholder="Enter office or unit"
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Select Lecturer</label>
            <select
              value={targetStaffId}
              onChange={(event) => setTargetStaffId(event.target.value)}
              className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
            >
              <option value="">No direct assignee</option>
              {staffList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.first_name} {item.last_name} ({item.role_name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Routing note</label>
            <textarea
              value={routingNote}
              onChange={(event) => setRoutingNote(event.target.value)}
              rows={4}
              placeholder="Add context for the routed complaint"
              className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
