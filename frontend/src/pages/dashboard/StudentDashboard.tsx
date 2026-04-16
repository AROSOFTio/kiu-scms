import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileSearch,
  FileText,
  ListFilter,
  LucideIcon,
  Search,
} from 'lucide-react';
import api from '../../lib/api';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface DashboardStats {
  total: number;
  pending: number;
  resolved: number;
}

interface ComplaintRecord {
  id: number;
  reference_number: string;
  title: string;
  status: string;
  category_name: string;
  created_at: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read?: boolean;
}

interface AppointmentRecord {
  id: number;
  appointment_date: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
  hod_first_name?: string;
  hod_last_name?: string;
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

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [appointmentsActive, setAppointmentsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsRes, complaintsRes, notificationsRes, appointmentsRes] = await Promise.allSettled([
          api.get('/complaints/stats'),
          api.get('/complaints', { params: { limit: 12 } }),
          api.get('/complaints/notifications'),
          api.get('/appointments'),
        ]);

        if (complaintsRes.status === 'rejected') {
          throw complaintsRes.reason;
        }

        const complaintData = complaintsRes.value.data.data || [];
        setComplaints(complaintData);

        if (statsRes.status === 'fulfilled') {
          const statsData = statsRes.value.data.data || {};
          setStats({
            total: statsData.total || complaintData.length,
            pending: statsData.pending || statsData.open || 0,
            resolved: statsData.resolved || 0,
          });
        } else {
          const pendingFallback = complaintData.filter(
            (complaint: ComplaintRecord) => !['Resolved', 'Closed', 'Rejected'].includes(complaint.status),
          ).length;

          setStats({
            total: complaintData.length,
            pending: pendingFallback,
            resolved: complaintData.filter((complaint: ComplaintRecord) => complaint.status === 'Resolved').length,
          });
        }

        if (notificationsRes.status === 'fulfilled') {
          setNotifications(notificationsRes.value.data.data || []);
        } else {
          setNotifications([]);
        }

        if (appointmentsRes.status === 'fulfilled') {
          setAppointments(appointmentsRes.value.data.data || []);
          setAppointmentsActive(true);
        } else {
          setAppointments([]);
          setAppointmentsActive(false);
        }
      } catch {
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statusOptions = useMemo(() => {
    const values = new Set<string>(['All']);
    complaints.forEach((complaint) => values.add(complaint.status));
    return Array.from(values);
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(search.toLowerCase()) ||
        complaint.reference_number.toLowerCase().includes(search.toLowerCase()) ||
        complaint.category_name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, statusFilter]);

  const alerts = useMemo(() => {
    const notificationAlerts = notifications.slice(0, 4).map((item) => ({
      id: `notification-${item.id}`,
      title: item.title || 'Complaint updated',
      message: item.message,
      date: item.created_at,
      tone: item.is_read ? 'border-slate-200 bg-white' : 'border-emerald-100 bg-emerald-50',
    }));

    const appointmentAlerts = appointments
      .filter((appointment) => appointment.status === 'Confirmed' || appointment.status === 'Pending')
      .slice(0, 2)
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        title: appointment.status === 'Confirmed' ? 'Appointment approved' : 'Appointment pending',
        message:
          appointment.status === 'Confirmed'
            ? `Meeting with ${appointment.hod_first_name || ''} ${appointment.hod_last_name || ''}`.trim()
            : 'Appointment request awaiting confirmation',
        date: appointment.appointment_date,
        tone: appointment.status === 'Confirmed' ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50',
      }));

    return [...notificationAlerts, ...appointmentAlerts].slice(0, 5);
  }, [appointments, notifications]);

  const statCards = [
    {
      label: 'Total',
      value: stats?.total || 0,
      icon: FileText,
      tone: 'bg-[#5b5ce6]',
    },
    {
      label: 'Pending',
      value: stats?.pending || 0,
      icon: Clock3,
      tone: 'bg-[#7a8191]',
    },
    {
      label: 'Resolved',
      value: stats?.resolved || 0,
      icon: CheckCircle2,
      tone: 'bg-[#24c16b]',
    },
  ];

  const actionCards: { label: string; icon: LucideIcon; href: string; tone: string }[] = [
    {
      label: 'Submit Complaint',
      icon: FilePlus2,
      href: '/dashboard/student/complaints/new',
      tone: 'bg-[#1f5eff]',
    },
    {
      label: 'Track Complaints',
      icon: ListFilter,
      href: '/dashboard/student/complaints',
      tone: 'bg-[#0ea5c6]',
    },
  ];

  if (appointmentsActive) {
    actionCards.push({
      label: 'Appointments',
      icon: CalendarDays,
      href: '/dashboard/appointments',
      tone: 'bg-[#475569]',
    });
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={AlertCircle}
          title="Dashboard unavailable"
          description={error}
          actionLabel="Reload"
          actionLink="/dashboard/student"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${appointmentsActive ? 'xl:grid-cols-6' : 'xl:grid-cols-5'}`}>
        {loading
          ? Array(appointmentsActive ? 6 : 5)
              .fill(0)
              .map((_, index) => <StatSkeleton key={index} />)
          : (
              <>
                {statCards.map((tile) => (
                  <div
                    key={tile.label}
                    className={`rounded-[26px] ${tile.tone} p-5 text-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.65)]`}
                  >
                    <div className="flex h-full min-h-[154px] flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                        <tile.icon className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-4xl font-bold leading-none">{tile.value}</p>
                      <p className="mt-3 text-sm font-medium text-white/90">{tile.label}</p>
                    </div>
                  </div>
                ))}
                {actionCards.map((tile) => (
                  <Link
                    key={tile.label}
                    to={tile.href}
                    className={`rounded-[26px] ${tile.tone} p-5 text-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5`}
                  >
                    <div className="flex h-full min-h-[154px] flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                        <tile.icon className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-base font-semibold text-white">{tile.label}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_-38px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Complaints</h2>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    type="text"
                    placeholder="Search"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:w-56"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
              </div>
            ) : filteredComplaints.length > 0 ? (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Ref</th>
                    <th className="px-5 py-3.5 font-semibold">Subject</th>
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">{complaint.reference_number}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{complaint.title}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{complaint.category_name}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(complaint.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/dashboard/student/complaints/${complaint.id}`}
                          className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={FileSearch}
                  title="No complaints"
                  description=""
                  actionLabel="Submit Complaint"
                  actionLink="/dashboard/student/complaints/new"
                />
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.35)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Alerts</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />)
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className={`rounded-2xl border p-3.5 ${alert.tone}`}>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{formatDate(alert.date)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No alerts.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
