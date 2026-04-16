import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock3,
  FileSearch,
  FileText,
  Route,
  TrendingUp,
} from 'lucide-react';
import api from '../../lib/api';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ComplaintStatusBadge } from '../../components/complaints/ComplaintLifecycle';

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
  display_status?: string;
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
  const underReviewCount = statusCount(byStatus, ['Submitted', 'Under Review']);
  const routedCount = statusCount(byStatus, ['Forwarded', 'In Progress', 'Awaiting Student']);
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
      label: 'Total Complaints',
      value: stats?.total || 0,
      icon: FileText,
      tone: 'bg-[#6a5af0]',
      textTone: 'text-white',
      iconTone: 'bg-white/18 text-white',
      accent: 'border-[#7f71ff]',
    },
    {
      label: 'Under Review',
      value: underReviewCount,
      icon: FileSearch,
      tone: 'bg-[#8d92a0]',
      textTone: 'text-white',
      iconTone: 'bg-white/10 text-white',
      accent: 'border-[#a2a8b5]',
    },
    {
      label: 'Routed Cases',
      value: routedCount,
      icon: Route,
      tone: 'bg-[#2dc66d]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
      accent: 'border-[#52d989]',
    },
    {
      label: 'Escalated Alerts',
      value: escalatedCount,
      icon: TrendingUp,
      tone: 'bg-[#18b7d2]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
      accent: 'border-[#37cde5]',
    },
  ];

  const quickActions = [
    {
      label: 'Complaint Queue',
      href: '/dashboard/admin/complaints',
      icon: FileText,
      tone: 'bg-[#2f2151]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
      border: 'border-[#44306f]',
    },
    {
      label: 'Route Complaints',
      href: '/dashboard/admin/complaints',
      icon: Route,
      tone: 'bg-[#d19f11]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
      border: 'border-[#e1b62d]',
    },
    {
      label: 'Case Reports',
      href: '/dashboard/admin/reports',
      icon: TrendingUp,
      tone: 'bg-[#3f915d]',
      textTone: 'text-white',
      iconTone: 'bg-white/10 text-white',
      border: 'border-[#5cad79]',
    },
    {
      label: 'Appointments',
      href: '/dashboard/appointments',
      icon: Clock3,
      tone: 'bg-[#22252c]',
      textTone: 'text-white',
      iconTone: 'bg-white/12 text-white',
      border: 'border-[#353944]',
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
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, index) => <StatSkeleton key={index} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-[16px] border p-5 shadow-[0_20px_36px_-30px_rgba(47,33,81,0.6)] ${card.tone} ${card.textTone} ${card.accent}`}
              >
                <div className="flex min-h-[150px] flex-col justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconTone}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold leading-none">{card.value}</p>
                    <p className="text-[15px] font-semibold">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`rounded-[16px] border p-5 shadow-[0_18px_34px_-28px_rgba(47,33,81,0.52)] transition hover:-translate-y-0.5 ${action.tone} ${action.textTone} ${action.border}`}
          >
            <div className="flex min-h-[124px] flex-col justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.iconTone}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <p className="text-[15px] font-semibold">{action.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[18px] border border-[#ddd8ea] bg-white p-5 shadow-[0_24px_52px_-40px_rgba(47,33,81,0.3)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7b7198]">Priority Alerts</h2>
          <div className="mt-5 space-y-3">
            {loading
              ? Array(3)
                  .fill(0)
                  .map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              : priorityAlerts.map((item) => (
                  <div key={item.label} className={`rounded-[16px] border p-4 ${item.tone}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-[#221934]">{item.value}</p>
                  </div>
                ))}
          </div>

          <div className="mt-5 rounded-[16px] border border-[#dfe3ee] bg-[#f7f8fb] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b7198]">Resolved Cases</p>
            <p className="mt-2 text-3xl font-bold text-[#2f2151]">{resolvedCount}</p>
            <p className="mt-2 text-sm text-slate-500">Closed and completed complaints across the current case cycle.</p>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[18px] border border-[#ddd8ea] bg-white shadow-[0_24px_52px_-40px_rgba(47,33,81,0.3)]">
          <div className="border-b border-[#ebe7f4] px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7b7198]">Recent Complaints</h2>
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
                <thead className="border-b border-[#ebe7f4] bg-[#f8f7fc] text-xs uppercase tracking-[0.18em] text-[#7b7198]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Ref No</th>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0edf7]">
                  {recentComplaints.map((complaint) => (
                    <tr key={complaint.id} className="transition hover:bg-[#faf9fd]">
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-[#f3f1fa] px-3 py-1 text-xs font-medium text-[#5c4b89]">
                          {complaint.reference_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {complaint.student_first_name} {complaint.student_last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{complaint.category_name}</td>
                      <td className="px-6 py-4">
                        <ComplaintStatusBadge status={complaint.display_status || complaint.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(complaint.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/dashboard/admin/complaints/${complaint.id}`}
                          className="text-sm font-semibold text-[#2f2151] transition hover:text-[#6a5af0]"
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
