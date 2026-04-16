import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Route,
  TrendingUp,
} from 'lucide-react';
import api from '../../lib/api';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface StatusCount {
  status: string;
  count: number;
}

interface DashboardStatsResponse {
  total: number;
  byStatus: StatusCount[];
  slaMetrics?: {
    breached?: number;
    onTrack?: number;
  };
  urgentCases?: Array<{ id: number }>;
}

interface ComplaintRecord {
  id: number;
  reference_number: string;
  status: string;
  category_name: string;
  created_at: string;
  student_first_name: string;
  student_last_name: string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const getStatusTone = (status: string) => {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'In Progress':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Awaiting Student':
      return 'bg-violet-50 text-violet-700 border-violet-100';
    case 'Forwarded':
    case 'Under Review':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Submitted':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

function statusCount(statuses: StatusCount[], keys: string[]) {
  return statuses
    .filter((item) => keys.includes(item.status))
    .reduce((sum, item) => sum + Number(item.count || 0), 0);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsRes, complaintsRes] = await Promise.allSettled([
          api.get('/admin/dashboard'),
          api.get('/admin/complaints', { params: { page: 1, limit: 8 } }),
        ]);

        const complaintsData: ComplaintRecord[] =
          complaintsRes.status === 'fulfilled' ? (complaintsRes.value.data.data || []) as ComplaintRecord[] : [];
        const complaintsTotal =
          complaintsRes.status === 'fulfilled' ? Number(complaintsRes.value.data.total || complaintsData.length) : 0;

        setRecentComplaints(complaintsData);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data.data || null);
        } else if (complaintsRes.status === 'fulfilled') {
          const fallbackStatuses = complaintsData.reduce((acc: Record<string, number>, complaint: ComplaintRecord) => {
            acc[complaint.status] = (acc[complaint.status] || 0) + 1;
            return acc;
          }, {});

          setStats({
            total: complaintsTotal,
            byStatus: Object.entries(fallbackStatuses).map(([status, count]) => ({ status, count: Number(count) })),
            slaMetrics: { breached: 0, onTrack: 0 },
            urgentCases: [],
          });
        } else {
          throw new Error('Dashboard requests failed');
        }
      } catch {
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const byStatus = stats?.byStatus || [];
  const pendingCount = statusCount(byStatus, ['Submitted', 'Under Review', 'Forwarded', 'In Progress', 'Awaiting Student']);
  const resolvedCount = statusCount(byStatus, ['Resolved', 'Closed']);
  const escalatedCount = stats?.urgentCases?.length || 0;

  const priorityAlerts = useMemo(() => {
    const overdue = Number(stats?.slaMetrics?.breached || 0);
    const pendingApprovals = statusCount(byStatus, ['Submitted', 'Under Review']);
    const unresolvedRouted = statusCount(byStatus, ['Forwarded', 'In Progress', 'Awaiting Student']);

    return [
      {
        label: 'Overdue complaints',
        value: overdue,
        tone: overdue > 0 ? 'border-rose-100 bg-rose-50' : 'border-slate-200 bg-white',
      },
      {
        label: 'Pending approvals',
        value: pendingApprovals,
        tone: pendingApprovals > 0 ? 'border-amber-100 bg-amber-50' : 'border-slate-200 bg-white',
      },
      {
        label: 'Unresolved routed complaints',
        value: unresolvedRouted,
        tone: unresolvedRouted > 0 ? 'border-blue-100 bg-blue-50' : 'border-slate-200 bg-white',
      },
    ];
  }, [byStatus, stats?.slaMetrics?.breached]);

  const statCards = [
    {
      label: 'Total',
      value: stats?.total || 0,
      icon: FileText,
      tone: 'bg-[#292929]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: Clock3,
      tone: 'bg-[#393836]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      tone: 'bg-[#34b05a]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
    },
    {
      label: 'Escalated',
      value: escalatedCount,
      icon: TrendingUp,
      tone: 'bg-white border border-slate-200',
      textTone: 'text-[#292929]',
      iconTone: 'bg-[#34b05a]/10 text-[#34b05a]',
    },
  ];

  const quickActions = [
    {
      label: 'Review Complaints',
      href: '/dashboard/admin/complaints',
      icon: FileText,
      tone: 'bg-[#34b05a]',
      textTone: 'text-white',
      iconTone: 'bg-white/15',
    },
    {
      label: 'Route Complaint',
      href: '/dashboard/admin/complaints',
      icon: Route,
      tone: 'bg-[#292929]',
      textTone: 'text-white',
      iconTone: 'bg-white/15',
    },
    {
      label: 'View Reports',
      href: '/dashboard/admin/reports',
      icon: TrendingUp,
      tone: 'bg-[#393836]',
      textTone: 'text-white',
      iconTone: 'bg-white/15',
    },
    {
      label: 'View Appointments',
      href: '/dashboard/appointments',
      icon: Clock3,
      tone: 'border border-slate-200 bg-white',
      textTone: 'text-[#292929]',
      iconTone: 'bg-[#34b05a]/10',
    },
  ];

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={AlertCircle}
          title="Dashboard unavailable"
          description={error}
          actionLabel="Reload"
          actionLink="/dashboard/admin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, index) => <StatSkeleton key={index} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-[22px] p-5 shadow-[0_22px_45px_-34px_rgba(41,41,41,0.38)] ${card.tone} ${card.textTone}`}
              >
                <div className="flex min-h-[146px] flex-col items-center justify-center text-center">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${card.iconTone}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-4xl font-bold leading-none">{card.value}</p>
                  <p className="mt-3 text-sm font-medium">{card.label}</p>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`rounded-[22px] p-5 shadow-[0_22px_45px_-34px_rgba(41,41,41,0.28)] transition hover:-translate-y-0.5 ${action.tone} ${action.textTone}`}
          >
            <div className="flex min-h-[146px] flex-col items-center justify-center text-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${action.iconTone}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-[15px] font-semibold">{action.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Alerts</h2>
          <div className="mt-5 space-y-3">
            {loading
              ? Array(3)
                  .fill(0)
                  .map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              : priorityAlerts.map((item) => (
                  <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_52px_-40px_rgba(41,41,41,0.28)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Complaint Queue</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-6">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
              </div>
            ) : recentComplaints.length > 0 ? (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Ref No</th>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentComplaints.map((complaint) => (
                    <tr key={complaint.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {complaint.reference_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {complaint.student_first_name} {complaint.student_last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{complaint.category_name}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(complaint.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to="/dashboard/admin/complaints"
                          className="text-sm font-medium text-[#34b05a] transition hover:text-[#2b8f48]"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={FileText}
                  title="No complaints"
                  description=""
                  actionLabel="Review Complaints"
                  actionLink="/dashboard/admin/complaints"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
