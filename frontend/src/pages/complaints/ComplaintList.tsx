import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import api from '../../lib/api';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ComplaintStatusBadge, LIFECYCLE_STATUSES } from '../../components/complaints/ComplaintLifecycle';

export default function ComplaintList() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
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
      setError('');
      try {
        const [compRes, catRes] = await Promise.all([
          api.get('/complaints', {
            params: {
              search: search || undefined,
              status: statusFilter || undefined,
              category: categoryFilter || undefined,
              page,
              limit,
            },
          }),
          api.get('/complaints/categories'),
        ]);
        setComplaints(compRes.data.data || []);
        setTotal(Number(compRes.data.total || 0));
        setCategories(catRes.data.data || []);
      } catch {
        setError('Unable to load complaint records.');
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(fetchData, 250);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-5 pb-10">
      <section className="app-page-header">
        <p className="app-page-kicker">Complaints</p>
        <h1 className="app-page-title">My Complaints</h1>
        <p className="app-page-subtitle">Track submitted complaints, current status, and recent activity.</p>
      </section>

      <section className="app-toolbar">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference or subject"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="app-input pl-11"
            />
          </label>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="app-input">
            <option value="">All statuses</option>
            {LIFECYCLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="app-input">
            <option value="">All types</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCategoryFilter('');
              setPage(1);
            }}
            className="rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-[#34b05a]/25 hover:text-[#34b05a]"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="app-card overflow-hidden">
        <div className="hidden grid-cols-[160px_minmax(0,1fr)_180px_160px_120px] gap-4 border-b border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:grid">
          <span>Ref No</span>
          <span>Subject</span>
          <span>Type</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => <TableRowSkeleton key={index} />)
          ) : error ? (
            <div className="p-6">
              <EmptyState icon={AlertCircle} title="Records unavailable" description={error} />
            </div>
          ) : complaints.length ? (
            complaints.map((complaint) => {
              const currentStatus = complaint.display_status || complaint.status;
              return (
                <div
                  key={complaint.id}
                  className="grid gap-4 px-6 py-5 transition hover:bg-slate-50 lg:grid-cols-[160px_minmax(0,1fr)_180px_160px_120px] lg:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900">{complaint.reference_number}</p>
                    <p className="mt-1 text-xs text-slate-400 lg:hidden">
                      {new Date(complaint.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{complaint.title}</p>
                    <p className="mt-1 text-sm text-slate-500 lg:hidden">{complaint.category_name}</p>
                  </div>

                  <div className="text-sm text-slate-600">{complaint.category_name}</div>

                  <div>
                    <ComplaintStatusBadge status={currentStatus} />
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      to={`/dashboard/student/complaints/${complaint.id}`}
                      className="text-sm font-medium text-[#34b05a] transition hover:text-[#2d9a4e]"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="No complaints"
                description="Your complaint records will appear here after submission."
                actionLabel="Submit complaint"
                actionLink="/dashboard/student/complaints/new"
              />
            </div>
          )}
        </div>
      </section>

      {total > limit && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-400">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-[14px] border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#34b05a]/25 hover:text-[#34b05a] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page * limit >= total}
              className="rounded-[14px] bg-[#34b05a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2d9a4e] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
