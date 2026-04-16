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
import { ComplaintStatusBadge } from '../../components/complaints/ComplaintLifecycle';

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
  display_status?: string;
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
            (complaint: ComplaintRecord) => !['Resolved', 'Closed', 'Rejected'].includes(complaint.display_status || complaint.status),
          ).length;

          setStats({
            total: complaintData.length,
            pending: pendingFallback,
            resolved: complaintData.filter((complaint: ComplaintRecord) => ['Resolved', 'Closed'].includes(complaint.display_status || complaint.status)).length,
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
    complaints.forEach((complaint) => values.add(complaint.display_status || complaint.status));
    return Array.from(values);
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(search.toLowerCase()) ||
        complaint.reference_number.toLowerCase().includes(search.toLowerCase()) ||
        complaint.category_name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || (complaint.display_status || complaint.status) === statusFilter;
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
      label: 'Total Complaints',
      value: stats?.total || 0,
      icon: FileText,
      tone: 'bg-[#2f3542]',
      textTone: 'text-white',
      iconTone: 'bg-white/12 text-white',
      border: 'border-[#3f4759]',
    },
    {
      label: 'Pending',
      value: stats?.pending || 0,
      icon: Clock3,
      tone: 'bg-[#d6a317]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
      border: 'border-[#e1b83b]',
    },
    {
      label: 'Resolved',
      value: stats?.resolved || 0,
      icon: CheckCircle2,
      tone: 'bg-[#2fbf71]',
      textTone: 'text-white',
      iconTone: 'bg-white/15 text-white',
      border: 'border-[#58d88f]',
    },
  ];

  const actionCards: { label: string; icon: LucideIcon; href: string; tone: string; textTone: string; iconTone: string; border: string }[] = [
    {
      label: 'Submit Complaint',
      icon: FilePlus2,
      href: '/dashboard/student/complaints/new',
      tone: 'bg-[#34b05a]',
      textTone: 'text-white',
      iconTone: 'bg-white/15',
      border: 'border-[#51c474]',
    },
    {
      label: 'Track Complaints',
      icon: ListFilter,
      href: '/dashboard/student/complaints',
      tone: 'bg-[#286f83]',
      textTone: 'text-white',
      iconTone: 'bg-white/10',
      border: 'border-[#43889a]',
    },
  ];

  if (appointmentsActive) {
    actionCards.push({
      label: 'Appointments',
      icon: CalendarDays,
      href: '/dashboard/appointments',
      tone: 'bg-[#5d4bb3]',
      textTone: 'text-white',
      iconTone: 'bg-white/10',
      border: 'border-[#7464c3]',
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
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[18px] border border-[#dfe5eb] bg-white shadow-[0_18px_48px_-34px_rgba(31,41,55,0.28)]">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
          <div className="h-12 w-1 rounded-full bg-[#34b05a]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6d7d88]">Student Workspace</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-[22px] font-semibold text-[#1f2937]">Complaint Dashboard</h2>
              <span className="text-sm font-medium text-[#34b05a]">Submit, track and follow complaint progress</span>
            </div>
          </div>
        </div>
      </section>

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
                    className={`rounded-[14px] ${tile.tone} ${tile.textTone} border p-5 shadow-[0_20px_36px_-30px_rgba(31,41,55,0.42)] ${tile.border}`}
                  >
                    <div className="flex min-h-[130px] flex-col justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${tile.iconTone}`}>
                        <tile.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-4xl font-bold leading-none">{tile.value}</p>
                        <p className="text-[15px] font-semibold">{tile.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {actionCards.map((tile) => (
                  <Link
                    key={tile.label}
                    to={tile.href}
                    className={`rounded-[14px] ${tile.tone} ${tile.textTone} border p-5 shadow-[0_20px_36px_-30px_rgba(31,41,55,0.34)] transition hover:-translate-y-0.5 ${tile.border}`}
                  >
                    <div className="flex min-h-[130px] flex-col justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${tile.iconTone}`}>
                        <tile.icon className="h-5 w-5" />
                      </div>
                      <p className="text-[15px] font-semibold">{tile.label}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-[18px] border border-[#dfe5eb] bg-white shadow-[0_24px_52px_-40px_rgba(31,41,55,0.28)]">
          <div className="border-b border-[#e9edf2] px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6d7d88]">My Complaints</h2>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    type="text"
                    placeholder="Search"
                    className="w-full rounded-[16px] border border-[#dfe5eb] bg-[#f8fafb] py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white focus:ring-4 focus:ring-[#34b05a]/10 sm:w-56"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-[16px] border border-[#dfe5eb] bg-[#f8fafb] px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#34b05a] focus:bg-white focus:ring-4 focus:ring-[#34b05a]/10"
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
                <thead className="border-b border-[#e9edf2] bg-[#f8fafb] text-xs uppercase tracking-[0.14em] text-[#6d7d88]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Ref</th>
                    <th className="px-5 py-3.5 font-semibold">Subject</th>
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f5]">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="transition hover:bg-[#fbfcfd]">
                      <td className="px-5 py-4 text-xs font-semibold text-[#44505c]">{complaint.reference_number}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{complaint.title}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{complaint.category_name}</td>
                      <td className="px-5 py-4">
                        <ComplaintStatusBadge status={complaint.display_status || complaint.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(complaint.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/dashboard/student/complaints/${complaint.id}`}
                          className="text-sm font-semibold text-[#34b05a] transition hover:text-[#287f43]"
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

        <aside className="rounded-[18px] border border-[#dfe5eb] bg-white p-5 shadow-[0_24px_52px_-40px_rgba(31,41,55,0.28)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6d7d88]">Alerts</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />)
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className={`rounded-[16px] border p-3.5 ${alert.tone}`}>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{formatDate(alert.date)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <EmptyState
                  icon={AlertCircle}
                  title="No notifications"
                  description="Complaint updates and appointment actions will appear here."
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
