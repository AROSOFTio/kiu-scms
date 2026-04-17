import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  UserRound,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import Calendar from '../../components/ui/Calendar';

interface DepartmentOption {
  id: number;
  name: string;
  faculty_id: number;
  is_default?: boolean;
}

interface OfficeContact {
  id: number;
  first_name: string;
  last_name: string;
  role_name: string;
  department_id: number;
  department_name: string;
}

interface AppointmentRecord {
  id: number;
  student_first_name?: string;
  student_last_name?: string;
  hod_first_name?: string;
  hod_last_name?: string;
  appointment_date: string;
  time_slot: string;
  reason: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
}

interface AvailabilityRecord {
  available_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const TIME_SLOTS = [
  '09:00 - 10:00 AM',
  '10:00 - 11:00 AM',
  '11:00 - 12:00 PM',
  '02:00 - 03:00 PM',
  '03:00 - 04:00 PM',
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [contacts, setContacts] = useState<OfficeContact[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [profileLinked, setProfileLinked] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');

  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [isBooking, setIsBooking] = useState(false);

  // HOD manages availability; Lecturer and Student book appointments
  const isHODRole = user?.role === 'HOD' || user?.role === 'SuperAdmin';

  const selectedContact = useMemo(
    () => contacts.find((contact) => String(contact.id) === selectedContactId) || null,
    [contacts, selectedContactId],
  );

  const availableDateStrings = useMemo(
    () => availability.map((item) => item.available_date),
    [availability],
  );

  const loadAppointments = async () => {
    const response = await api.get('/appointments');
    setAppointments(response.data.data || []);
  };

  const loadAvailability = async (contactId: number) => {
    const response = await api.get(`/appointments/availability/${contactId}`);
    setAvailability(response.data.data || []);
  };

  const loadStudentDepartments = async () => {
    const response = await api.get('/appointments/departments');
    const payload = response.data.data || {};
    const departmentData = payload.departments || [];
    const defaultDepartmentId = payload.defaultDepartmentId;
    const linked = payload.profileLinked !== false;
    setDepartments(departmentData);
    setProfileLinked(linked);
    setProfileMessage(payload.profileMessage || '');
    if (defaultDepartmentId) {
      setSelectedDepartmentId(String(defaultDepartmentId));
    } else if (linked && departmentData.length > 0) {
      setSelectedDepartmentId(String(departmentData[0].id));
    } else {
      setSelectedDepartmentId('');
    }
  };

  const loadContacts = async (departmentId: string) => {
    if (!departmentId) {
      setContacts([]);
      setSelectedContactId('');
      setAvailability([]);
      setSelectedDate(null);
      return;
    }

    try {
      const response = await api.get('/appointments/hods', { params: { departmentId } });
      const contactData = response.data.data || [];
      setContacts(contactData);
      setSelectedContactId(contactData.length ? String(contactData[0].id) : '');
    } catch {
      setContacts([]);
      setSelectedContactId('');
      setAvailability([]);
      toast.error('Failed to load department contacts');
    }
  };

  useEffect(() => {
    const initialise = async () => {
      setLoading(true);
      setError('');

      try {
        if (isHODRole && user) {
          await Promise.all([loadAvailability(user.id), loadAppointments()]);
        } else {
          await Promise.all([loadStudentDepartments(), loadAppointments()]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Unable to load appointments.');
      } finally {
        setLoading(false);
      }
    };

    initialise();
  }, [isHODRole, user?.id]);

  useEffect(() => {
    if (!isHODRole && selectedDepartmentId) {
      loadContacts(selectedDepartmentId);
    }
  }, [isHODRole, selectedDepartmentId]);

  useEffect(() => {
    if (isHODRole && user) {
      loadAvailability(user.id).catch(() => setAvailability([]));
      return;
    }

    if (selectedContactId) {
      loadAvailability(Number(selectedContactId)).catch(() => setAvailability([]));
    } else {
      setAvailability([]);
      setSelectedDate(null);
    }
  }, [isHODRole, selectedContactId, user?.id]);

  const handleBook = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedDate || !selectedContactId) {
      toast.error('Select a date and HOD to book with');
      return;
    }

    setIsBooking(true);
    try {
      await api.post('/appointments', {
        hodId: Number(selectedContactId),
        date: selectedDate.toISOString().split('T')[0],
        timeSlot,
        reason: reason.trim(),
      });
      toast.success('Appointment requested successfully');
      setReason('');
      setSelectedDate(null);
      await Promise.all([
        loadAppointments(),
        isHODRole ? loadAvailability(user!.id) : loadStudentDepartments(),
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: AppointmentRecord['status']) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status.toLowerCase()}`);
      await loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update appointment');
    }
  };

  const handleToggleAvailability = async (date: string, isAvailable: boolean) => {
    try {
      await api.put('/appointments/availability', { date, isAvailable });
      if (user) { await loadAvailability(user.id); }
      toast.success('Availability updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={CalendarDays}
          title="Appointments unavailable"
          description={error}
          actionLabel="Open dashboard"
          actionLink={isHODRole ? '/dashboard/hod' : '/dashboard/student'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="app-card px-5 py-5">
        <div className="app-page-header">
          <p className="app-page-kicker">Appointments</p>
          <h1 className="app-page-title">{isHODRole ? 'HOD Appointments' : 'Book Appointment'}</h1>
          <p className="app-page-subtitle">
            {isHODRole
              ? 'Manage your availability and respond to student appointment requests.'
              : 'Select your HOD and request an appointment in your department.'}
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          {!isHODRole && (
            <div className="app-card p-5">
              {!profileLinked && profileMessage ? (
                <div className="mb-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {profileMessage}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Department</label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(event) => {
                      setSelectedDepartmentId(event.target.value);
                      setSelectedDate(null);
                    }}
                    className="app-input"
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Office contact</label>
                  <select
                    value={selectedContactId}
                    onChange={(event) => {
                      setSelectedContactId(event.target.value);
                      setSelectedDate(null);
                    }}
                    disabled={!contacts.length}
                    className={`app-input ${!contacts.length ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''}`}
                  >
                    <option value="">Select contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} ({contact.role_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!departments.length && (
                <div className="mt-4">
                  <EmptyState
                    icon={Building2}
                    title="No departments available"
                    description="Departments must be configured before students can request appointments."
                  />
                </div>
              )}

              {Boolean(selectedDepartmentId && !contacts.length) && (
                <div className="mt-4">
                  <EmptyState
                    icon={UserRound}
                    title="No contacts in this department"
                    description="Select another department or ask an administrator to assign an office contact."
                  />
                </div>
              )}
            </div>
          )}

          <Calendar
            availableDates={availableDateStrings}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
            mode={isHODRole ? 'office' : 'student'}
            onToggleAvailability={isHODRole ? handleToggleAvailability : undefined}
          />

          {!isHODRole && selectedContact && selectedDate && (
            <div className="app-card p-5 animate-in fade-in duration-300">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Request appointment</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedContact.first_name} {selectedContact.last_name} • {formatDate(selectedDate.toISOString())}
                  </p>
                </div>
                <div className="rounded-full bg-[#34b05a]/10 px-3 py-1 text-xs font-semibold text-[#34b05a]">
                  {timeSlot}
                </div>
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time slot</label>
                    <select value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)} className="app-input">
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Selected date</label>
                    <div className="app-input flex items-center gap-2 bg-slate-50">
                      <CheckCircle2 className="h-4 w-4 text-[#34b05a]" />
                      <span>{formatDate(selectedDate.toISOString())}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    placeholder="State the issue you want to discuss."
                    className="app-input min-h-[130px] resize-y"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!reason.trim() || isBooking}
                    className="inline-flex items-center gap-2 rounded-[16px] bg-[#34b05a] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2d9a4e] disabled:bg-slate-300"
                  >
                    {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Send request
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          {!isHODRole && selectedContact && (
            <section className="app-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Selected office</h2>
              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedContact.first_name} {selectedContact.last_name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{selectedContact.role_name}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {selectedContact.department_name}
                </p>
              </div>
            </section>
          )}

          <section className="app-card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{isHODRole ? 'Appointment Requests' : 'My appointments'}</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {appointments.length ? (
                appointments.map((appointment) => {
                  const statusTone =
                    appointment.status === 'Confirmed'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : appointment.status === 'Pending'
                        ? 'border-amber-100 bg-amber-50 text-amber-700'
                        : appointment.status === 'Completed'
                          ? 'border-blue-100 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500';

                  return (
                    <div key={appointment.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {isHODRole
                              ? `${appointment.student_first_name} ${appointment.student_last_name}`
                              : `${appointment.hod_first_name} ${appointment.hod_last_name}`}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays className="h-4 w-4" />
                            <span>{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Clock3 className="h-4 w-4" />
                            <span>{appointment.time_slot}</span>
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">{appointment.reason}</p>

                      {isHODRole && appointment.status === 'Pending' && (
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(appointment.id, 'Confirmed')}
                            className="rounded-[14px] bg-[#34b05a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2d9a4e]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(appointment.id, 'Rejected')}
                            className="rounded-[14px] border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4">
                  <EmptyState
                    icon={CalendarDays}
                    title={isHODRole ? 'No appointment requests' : 'No appointments'}
                    description={isHODRole ? 'Student appointment requests will appear here.' : 'Your upcoming and past appointments will appear here.'}
                  />
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
