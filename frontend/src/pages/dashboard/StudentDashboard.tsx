import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  Search,
} from 'lucide-react';
import api from '../../lib/api';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
}

interface ComplaintRecord {
  id: number;
  reference_number: string;
  title: string;
  status: string;
  priority?: string;
  category_name: string;
  created_at: string;
  updated_at?: string;
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
  time_slot: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, complaintsRes, notificationsRes, appointmentsRes] = await Promise.all([
          api.get('/complaints/stats'),
          api.get('/complaints', { params: { limit: 12 } }),
          api.get('/complaints/notifications'),
          api.get('/appointments'),
        ]);

        const statsData = statsRes.data.data || {};

        setStats({
          total: statsData.total || 0,
          open: statsData.open || 0,
          resolved: statsData.resolved || 0,
        });
        setComplaints(complaintsRes.data.data || []);
        setNotifications(notificationsRes.data.data || []);
        setAppointments(appointmentsRes.data.data || []);
      } catch (err) {
        setError('Unable to load your dashboard right now.');
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
      title: item.title,
      message: item.message,
      date: item.created_at,
      tone: item.is_read ? 'border-slate-200 bg-white' : 'border-emerald-100 bg-emerald-50/70',
    }));

    const appointmentAlerts = appointments
      .filter((appointment) => appointment.status === 'Confirmed' || appointment.status === 'Pending')
      .slice(0, 2)
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        title: appointment.status === 'Confirmed' ? 'Appointment approved' : 'Appointment pending',
        message:
          appointment.status === 'Confirmed'
            ? `Meeting with HOD ${appointment.hod_first_name || ''} ${appointment.hod_last_name || ''} on ${formatDate(appointment.appointment_date)}.`
            : `Appointment request for ${formatDate(appointment.appointment_date)} is awaiting confirmation.`,
        date: appointment.appointment_date,
        tone: appointment.status === 'Confirmed' ? 'border-blue-100 bg-blue-50/70' : 'border-amber-100 bg-amber-50/70',
      }));

    return [...notificationAlerts, ...appointmentAlerts].slice(0, 5);
  }, [appointments, notifications]);

  const statCards = [
    {
      label: 'Total Complaints',
      value: stats?.total || 0,
      icon: FileText,
      iconTone: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Pending',
      value: stats?.open || 0,
      icon: Clock3,
      iconTone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Resolved',
      value: stats?.resolved || 0,
      icon: CheckCircle2,
      iconTone: 'bg-emerald-50 text-emerald-700',
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
          actionLink="/dashboard/student"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="app-page-header">
        <span className="app-page-kicker">Student dashboard</span>
        <h1 className="app-page-title">Complaint overview</h1>
        <p className="app-page-subtitle">Submit, track, and review complaint activity from one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {loading
          ? Array(3)
              .fill(0)
              .map((_, index) => <StatSkeleton key={index} />)
          : statCards.map((card) => (
              <div key={card.label} className="app-card p-6">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconTone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          to="/dashboard/student/complaints/new"
          className="app-card group flex items-center justify-between p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-200"
        >
          <div>
            <p className="text-lg font-semibold text-slate-900">Submit Complaint</p>
            <p className="mt-1 text-sm text-slate-500">Create a new complaint record.</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 transition group-hover:bg-emerald-100">
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>

        <Link
          to="/dashboard/student/complaints"
          className="app-card group flex items-center justify-between p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300"
        >
          <div>
            <p className="text-lg font-semibold text-slate-900">Track Complaints</p>
            <p className="mt-1 text-sm text-slate-500">Review status and progress updates.</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition group-hover:bg-slate-200">
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>

        <Link
          to="/dashboard/appointments"
          className="app-card group flex items-center justify-between p-6 transition-all hover:-translate-y-0.5 hover:border-blue-200"
        >
          <div>
            <p className="text-lg font-semibold text-slate-900">Appointments</p>
            <p className="mt-1 text-sm text-slate-500">Book or review HOD appointments.</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700 transition group-hover:bg-blue-100">
            <Calendar className="h-5 w-5" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="app-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent complaints</h2>
                <p className="mt-1 text-sm text-slate-500">Recent complaint records and status activity.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    type="text"
                    placeholder="Search complaints"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:w-64"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
              <div className="space-y-3 p-6">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
              </div>
            ) : filteredComplaints.length > 0 ? (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Reference</th>
                    <th className="px-6 py-4 font-semibold">Subject</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {complaint.reference_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{complaint.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{complaint.category_name}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(complaint.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/dashboard/student/complaints/${complaint.id}`}
                          className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={FileSearch}
                  title="No complaints found"
                  description="Try a different search term or clear the current filter."
                  actionLabel="Submit Complaint"
                  actionLink="/dashboard/student/complaints/new"
                />
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="app-card p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
              <p className="mt-1 text-sm text-slate-500">Latest complaint and appointment updates.</p>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array(4)
                  .fill(0)
                  .map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              ) : alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className={`rounded-2xl border p-4 ${alert.tone}`}>
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{alert.message}</p>
                    <p className="mt-3 text-xs font-medium text-slate-500">{formatDate(alert.date)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No new alerts.
                </div>
              )}
            </div>
          </div>

          <div className="app-card p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Quick summary</h2>
              <p className="mt-1 text-sm text-slate-500">Current student activity.</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Complaints in review</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.open || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Open appointments</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {appointments.filter((appointment) => appointment.status === 'Pending' || appointment.status === 'Confirmed').length}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
