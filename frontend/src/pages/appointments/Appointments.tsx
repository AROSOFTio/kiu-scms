import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Plus,
  History,
  Info
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
  available_date: string;
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

  const handleToggleAvailability = async (date: string, isAvailable: boolean) => {
    try {
        await api.put('/appointments/availability', { date, isAvailable });
        fetchAvailability(user!.id);
        toast.success(`Office presence updated for ${date}`);
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const availableDateStrings = availability.map(a => a.available_date);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {isHOD ? 'HOD Scheduler' : 'Book HOD Appointment'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {isHOD 
              ? 'Click on the calendar to mark your office presence for students.' 
              : 'Schedule a formal session with your Head of Department.'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Institutional Calendar Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Calendar Interaction */}
        <div className="lg:col-span-8 space-y-8">
          {!isHOD && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 border-r border-slate-100">Select Department</span>
              {hods.map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHOD(h)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest ${
                    selectedHOD?.id === h.id 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20' 
                      : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-emerald-200'
                  }`}
                >
                  {h.first_name} {h.last_name}
                </button>
              ))}
            </div>
          )}

          <Calendar 
            availableDates={availableDateStrings} 
            onDateSelect={setSelectedDate} 
            selectedDate={selectedDate}
            mode={isHOD ? 'hod' : 'student'}
            onToggleAvailability={isHOD ? handleToggleAvailability : undefined}
          />

          {!isHOD && selectedDate && (
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 animate-in slide-in-from-bottom-6 duration-500">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Plus className="h-6 w-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Finalize Booking</h3>
                      <p className="text-xs text-slate-400 font-medium tracking-wide">Enter session details for the selected slot.</p>
                   </div>
                </div>
                
                <form onSubmit={handleBook} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Time Window</label>
                      <div className="relative">
                         <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                         <select 
                           value={timeSlot}
                           onChange={(e) => setTimeSlot(e.target.value)}
                           className="w-full pl-14 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] outline-none focus:border-emerald-500 font-black text-xs uppercase tracking-widest appearance-none"
                         >
                           <option>09:00 - 10:00 AM</option>
                           <option>10:00 - 11:00 AM</option>
                           <option>11:00 - 12:00 PM</option>
                           <option>02:00 - 03:00 PM</option>
                           <option>03:00 - 04:00 PM</option>
                         </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Selected Engagement Date</label>
                       <div className="w-full px-6 py-5 bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] font-black text-xs text-emerald-700 uppercase tracking-widest flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4" />
                          {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Context of Consultation</label>
                    <textarea 
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Institutional context or specific academic issue..."
                      className="w-full px-6 py-6 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] outline-none focus:border-emerald-500 font-medium text-sm resize-none h-40 leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-6 pt-4">
                     <button type="button" onClick={() => setSelectedDate(null)} className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] hover:text-slate-900 transition-colors">Discard Draft</button>
                     <button 
                       disabled={isBooking}
                       type="submit"
                       className="px-14 py-6 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:bg-slate-200"
                     >
                       {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Engagement Request'}
                     </button>
                  </div>
                </form>
             </div>
          )}
        </div>

        {/* Right Column: List of Appointments */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">My Session History</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Timeline of engagements</p>
                 </div>
                 <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <History className="h-4 w-4 text-emerald-600" />
                 </div>
              </div>

              <div className="divide-y divide-slate-50 max-h-[1000px] overflow-y-auto custom-scrollbar">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        appt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        appt.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {appt.status}
                      </div>
                      <span className="text-[10px] text-slate-400 font-black tabular-nums">{appt.appointment_date}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                          {isHOD ? `${appt.student_first_name} ${appt.student_last_name}` : `HOD ${appt.hod_first_name} ${appt.hod_last_name}`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {appt.time_slot}
                        </p>
                      </div>
                    </div>

                    <p className="text-[12px] text-slate-500 font-medium mb-6 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                      "{appt.reason}"
                    </p>

                    {isHOD && appt.status === 'Pending' && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                        <button 
                          onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                          className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
                        >
                           Confirm
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                          className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                        >
                           Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {appointments.length === 0 && (
                  <div className="p-20 text-center">
                    <CalendarIcon className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No engagements recorded</p>
                  </div>
                )}
              </div>
           </div>

           <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Info size={100} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4">Scheduling Protocol</h4>
              <p className="text-[11px] text-emerald-50/70 font-medium leading-relaxed">
                 Sessions are strictly academic. Please ensure you are present at the HOD's office 5 minutes before your scheduled window.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
