import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Plus
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Calendar from '../../components/ui/Calendar';

interface HOD {
  id: number;
  first_name: string;
  last_name: string;
}

interface Appointment {
  id: number;
  student_first_name?: string;
  student_last_name?: string;
  hod_first_name?: string;
  hod_last_name?: string;
  appointment_date: string;
  time_slot: string;
  reason: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}

interface Availability {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [hods, setHods] = useState<HOD[]>([]);
  const [selectedHOD, setSelectedHOD] = useState<HOD | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 - 11:00 AM');
  const [isBooking, setIsBooking] = useState(false);

  // HOD specific state
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  const isHOD = user?.role === 'Admin';

  const fetchHODs = async () => {
    try {
      const res = await api.get('/appointments/hods');
      setHods(res.data.data);
      if (res.data.data.length > 0 && !isHOD) setSelectedHOD(res.data.data[0]);
    } catch (err) {
      toast.error('Failed to fetch HOD list');
    }
  };

  const fetchAvailability = async (hodId: number) => {
    try {
      const res = await api.get(`/appointments/availability/${hodId}`);
      setAvailability(res.data.data);
    } catch (err) {
      console.error('Failed to fetch availability');
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHOD) {
      fetchAvailability(user.id);
    } else {
      fetchHODs();
    }
    fetchAppointments();
  }, [user]);

  useEffect(() => {
    if (selectedHOD) {
      fetchAvailability(selectedHOD.id);
    }
  }, [selectedHOD]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedHOD) {
      toast.error('Please select a date and HOD');
      return;
    }

    setIsBooking(true);
    try {
      await api.post('/appointments', {
        hodId: selectedHOD.id,
        date: selectedDate.toISOString().split('T')[0],
        timeSlot,
        reason
      });
      toast.success('Appointment requested successfully');
      setReason('');
      setSelectedDate(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const toggleDayAvailability = async (day: string, current: boolean) => {
    const updatedSchedules = [{
        day_of_week: day,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: !current
    }];

    try {
        await api.put('/appointments/availability', { schedules: updatedSchedules });
        fetchAvailability(user!.id);
        toast.success('Availability updated');
    } catch (err) {
        toast.error('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const availableDayNames = availability.filter(a => a.is_available).map(a => a.day_of_week);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {isHOD ? 'Appointment Management' : 'Book HOD Appointment'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {isHOD 
              ? 'Manage consultation sessions and set your office availability.' 
              : 'Schedule a formal session with your Head of Department.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Calendar & Booking (Student) / Availability (HOD) */}
        <div className="lg:col-span-2 space-y-8">
          {!isHOD && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select HOD / Officer</label>
              <div className="flex flex-wrap gap-3">
                {hods.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHOD(h)}
                    className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border ${
                      selectedHOD?.id === h.id 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20' 
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-white hover:border-emerald-200'
                    }`}
                  >
                    HOD {h.first_name} {h.last_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isHOD ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Office Day Settings</h3>
              <p className="text-sm text-slate-500 font-medium">Set which days you are available for student consultations in office.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                  const schedule = availability.find(a => a.day_of_week === day);
                  const active = schedule?.is_available || false;
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDayAvailability(day, active)}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all group ${
                        active 
                          ? 'border-emerald-500 bg-emerald-50/30' 
                          : 'border-slate-100 bg-white hover:border-emerald-200'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${active ? 'text-emerald-600' : 'text-slate-400'}`}>{day}</span>
                      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                        {active ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Calendar 
              availableDays={availableDayNames} 
              onDateSelect={setSelectedDate} 
              selectedDate={selectedDate}
            />
          )}

          {!isHOD && selectedDate && (
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Booking Details</h3>
                <form onSubmit={handleBook} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appointment Time</label>
                      <select 
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm"
                      >
                        <option>09:00 - 10:00 AM</option>
                        <option>10:00 - 11:00 AM</option>
                        <option>11:00 - 12:00 PM</option>
                        <option>02:00 - 03:00 PM</option>
                        <option>03:00 - 04:00 PM</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selected Date</label>
                       <div className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-sm text-emerald-700">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                       </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Session</label>
                    <textarea 
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Briefly describe what you would like to discuss..."
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-medium text-sm resize-none h-32"
                    />
                  </div>
                  <button 
                    disabled={isBooking}
                    type="submit"
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking Request'}
                  </button>
                </form>
             </div>
          )}
        </div>

        {/* Right Column: Appointment List */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <CalendarIcon size={100} />
             </div>
             <h3 className="text-xl font-black tracking-tight mb-2">My Sessions</h3>
             <p className="text-slate-400 text-xs font-medium">Track your upcoming consultations.</p>
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {appointments.map((appt) => (
              <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    appt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                    appt.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                    appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {appt.status}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">{appt.appointment_date}</span>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">
                      {isHOD ? `${appt.student_first_name} ${appt.student_last_name}` : `HOD ${appt.hod_first_name} ${appt.hod_last_name}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {appt.time_slot}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium mb-6 line-clamp-2 italic leading-relaxed">
                  "{appt.reason}"
                </p>

                {isHOD && appt.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                      className="flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Confirm
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                      className="flex items-center justify-center gap-1 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-colors"
                    >
                      <XCircle className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                )}

                {appt.status === 'Confirmed' && (
                   <div className="mt-4 p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scheduled Session</span>
                   </div>
                )}
              </div>
            ))}

            {appointments.length === 0 && (
              <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <CalendarIcon className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No appointments found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
