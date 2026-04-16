import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, FileText, ListTodo } from 'lucide-react';
import api from '../../lib/api';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  total: number;
  byStatus: { status: string; count: number }[];
  recentActivity: Array<{
    id: number;
    complaint_id?: number;
    reference_number: string;
    status: string;
    changed_at: string;
  }>;
  urgentCases: Array<{
    id: number;
    reference_number: string;
    title: string;
    priority: string;
    created_at: string;
  }>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function countStatuses(items: DashboardStats['byStatus'], keys: string[]) {
  return items
    .filter((item) => keys.includes(item.status))
    .reduce((sum, item) => sum + Number(item.count || 0), 0);
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaffStats = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data || null);
      } catch {
        setError('Unable to load workspace data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffStats();
  }, []);

  const statusItems = stats?.byStatus || [];
  const pending = countStatuses(statusItems, ['Submitted', 'Under Review', 'In Progress', 'Awaiting Student']);
  const resolved = countStatuses(statusItems, ['Resolved', 'Closed']);
  const urgent = stats?.urgentCases?.length || 0;

  const statCards = useMemo(
    () => [
      { label: 'Assigned', value: stats?.total || 0, icon: FileText, tone: 'bg-[#34b05a] text-white', iconTone: 'bg-white/15' },
      { label: 'Pending', value: pending, icon: Clock3, tone: 'bg-[#34b05a]/15 border border-[#34b05a]/20 text-[#292929]', iconTone: 'bg-[#34b05a]/10' },
      { label: 'Resolved', value: resolved, icon: CheckCircle2, tone: 'bg-[#2d9a4e] text-white', iconTone: 'bg-white/15' },
    ],
    [pending, resolved, stats?.total],
  );

  const actions = [
    { label: 'Worklist', href: '/dashboard/staff/worklist', icon: ListTodo, tone: 'bg-[#34b05a] text-white', iconTone: 'bg-white/15' },
    { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays, tone: 'bg-[#34b05a]/12 border border-[#34b05a]/20 text-[#292929]', iconTone: 'bg-[#34b05a]/10' },
  ];

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading
          ? Array(5)
              .fill(0)
              .map((_, index) => <CardSkeleton key={index} />)
          : (
              <>
                {statCards.map((tile) => (
                  <div
                    key={tile.label}
                    className={`rounded-[22px] p-5 shadow-[0_22px_45px_-34px_rgba(41,41,41,0.38)] ${tile.tone}`}
                  >
                    <div className="flex min-h-[146px] flex-col items-center justify-center text-center">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${tile.iconTone}`}>
                        <tile.icon className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-4xl font-bold leading-none">{tile.value}</p>
                      <p className="mt-3 text-sm font-medium">{tile.label}</p>
                    </div>
                  </div>
                ))}

                {actions.map((tile) => (
                  <Link
                    key={tile.label}
                    to={tile.href}
                    className={`rounded-[22px] p-5 shadow-[0_22px_45px_-34px_rgba(41,41,41,0.28)] transition hover:-translate-y-0.5 ${tile.tone}`}
                  >
                    <div className="flex min-h-[146px] flex-col items-center justify-center text-center">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${tile.iconTone}`}>
                        <tile.icon className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-[15px] font-semibold">{tile.label}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Alerts</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Urgent</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{urgent}</p>
            </div>

            {stats?.urgentCases?.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                to={`/dashboard/staff/complaints/${item.id}`}
                className="block rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-[#34b05a]/40"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.reference_number}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.created_at)}</p>
              </Link>
            ))}

            {!loading && urgent === 0 && (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No urgent cases
              </div>
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              {user?.role === 'Department Officer' ? 'Department Feed' : 'Recent Activity'}
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="space-y-3 p-5">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-[18px] bg-slate-100" />
                  ))}
              </div>
            ) : stats?.recentActivity?.length ? (
              stats.recentActivity.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  to={`/dashboard/staff/complaints/${item.complaint_id || item.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.reference_number}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.status === 'Submitted' ? 'Pending' : item.status}</p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-slate-400">{formatDate(item.changed_at)}</p>
                </Link>
              ))
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={FileText}
                  title="No activity"
                  description=""
                  actionLabel="Open Worklist"
                  actionLink="/dashboard/staff/worklist"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
