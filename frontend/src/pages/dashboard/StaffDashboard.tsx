import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareMore,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../../lib/api';
import { EmptyState } from '../../components/ui/EmptyState';

interface Complaint {
  id: number;
  reference_number: string;
  title: string;
  status: string;
  category_name: string;
  created_at: string;
  student_first_name: string;
  student_last_name: string;
}

type QueueFilter = 'all' | 'Pending' | 'In Progress' | 'Awaiting Student' | 'Resolved';

const FILTERS: QueueFilter[] = ['all', 'Pending', 'In Progress', 'Awaiting Student', 'Resolved'];
const FILTER_STATUS_MAP: Record<Exclude<QueueFilter, 'all'>, string[]> = {
  Pending: ['Submitted', 'Under Review'],
  'In Progress': ['In Progress'],
  'Awaiting Student': ['Awaiting Student'],
  Resolved: ['Resolved', 'Closed'],
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<QueueFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');

    try {
      const params: Record<string, string | number> = {
        assignedToMe: 'true',
        page,
        limit,
      };

      if (search.trim()) params.search = search.trim();

      if (activeFilter !== 'all') {
        const statuses = FILTER_STATUS_MAP[activeFilter];
        if (statuses.length === 1) {
          params.status = statuses[0];
        } else {
          params.statuses = statuses.join(',');
        }
      }

      const res = await api.get('/admin/complaints', { params });
      setComplaints(res.data.data || []);
      setTotal(Number(res.data.total || 0));
    } catch {
      setError('Unable to load assigned complaints.');
      setComplaints([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchComplaints, 250);
    return () => window.clearTimeout(timer);
  }, [activeFilter, page, search]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  const summary = useMemo(() => {
    return complaints.reduce(
      (acc, complaint) => {
        const label = getStatusLabel(complaint.status);
        acc.total += 1;
        if (label === 'Pending') acc.pending += 1;
        if (label === 'In Progress') acc.inProgress += 1;
        if (label === 'Awaiting Student') acc.awaitingStudent += 1;
        if (label === 'Resolved') acc.resolved += 1;
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, awaitingStudent: 0, resolved: 0 },
    );
  }, [complaints]);

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={AlertCircle}
          title="Workspace unavailable"
          description={error}
          actionLabel="Reload"
          actionLink="/dashboard/staff"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Assigned', value: total, icon: MessageSquareMore, tone: 'bg-[#292929] text-white border-[#292929]', iconTone: 'text-white/80' },
              { label: 'Pending', value: summary.pending, icon: Clock3, tone: 'bg-[#393836] text-white border-[#393836]', iconTone: 'text-white/80' },
              { label: 'Awaiting Student', value: summary.awaitingStudent, icon: RefreshCw, tone: 'bg-white text-[#292929] border-slate-200', iconTone: 'text-[#34b05a]' },
              { label: 'Resolved', value: summary.resolved, icon: CheckCircle2, tone: 'bg-[#34b05a] text-white border-[#34b05a]', iconTone: 'text-white/85' },
            ].map((item) => (
              <div key={item.label} className={`min-w-[112px] rounded-[18px] border px-4 py-3 shadow-[0_18px_38px_-34px_rgba(41,41,41,0.4)] ${item.tone}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{item.label}</span>
                  <item.icon className={`h-4 w-4 ${item.iconTone}`} />
                </div>
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[260px] flex-1 sm:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assigned complaints"
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveFilter('all');
                setPage(1);
              }}
              className="inline-flex items-center justify-center rounded-[16px] border border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:border-[#34b05a]/25 hover:text-[#34b05a]"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#34b05a] text-white shadow-[0_16px_32px_-20px_rgba(52,176,90,0.6)]'
                    : 'border border-slate-200 bg-white text-slate-500 hover:border-[#34b05a]/25 hover:text-[#34b05a]'
                }`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
        <div className="hidden grid-cols-[150px_minmax(0,1fr)_180px_150px_120px] gap-4 border-b border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 lg:grid">
          <span>Ref No</span>
          <span>Student</span>
          <span>Type</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#34b05a]" />
            </div>
          ) : complaints.length ? (
            complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="grid gap-4 px-6 py-5 transition hover:bg-slate-50 lg:grid-cols-[150px_minmax(0,1fr)_180px_150px_120px] lg:items-center"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900">{complaint.reference_number}</p>
                  <p className="mt-1 text-xs text-slate-400 lg:hidden">{formatDate(complaint.created_at)}</p>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {complaint.student_first_name} {complaint.student_last_name}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">{complaint.title}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-700">{complaint.category_name}</p>
                  <p className="mt-1 text-xs text-slate-400 lg:hidden">{formatDate(complaint.created_at)}</p>
                </div>

                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusTone(getStatusLabel(complaint.status))}`}>
                    {getStatusLabel(complaint.status)}
                  </span>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    to={`/dashboard/staff/complaints/${complaint.id}`}
                    className="inline-flex items-center gap-2 rounded-[14px] bg-[#34b05a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2d9a4e]"
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <EmptyState
                icon={MessageSquareMore}
                title="No assigned complaints"
                description=""
              />
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
