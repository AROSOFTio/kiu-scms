import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  onToggleAvailability?: (date: string, isAvailable: boolean) => void;
  availableDates: string[]; // ['2026-04-12', '2026-04-15']
  selectedDate: Date | null;
  mode: 'student' | 'hod';
}

export default function Calendar({ onDateSelect, availableDates, selectedDate, onToggleAvailability, mode }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);

  const today = new Date();
  today.setHours(0,0,0,0);

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const isAvailable = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availableDates.includes(dateStr);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (mode === 'hod' && onToggleAvailability) {
      onToggleAvailability(dateStr, !isAvailable(day));
    } else {
      if (isAvailable(day) || mode === 'hod') {
        onDateSelect(date);
      }
    }
  };

  const days = [];
  for (let i = 0; i < offset; i++) days.push(<div key={`empty-${i}`} />);
  for (let i = 1; i <= totalDays; i++) {
    const available = isAvailable(i);
    const selected = isSelected(i);
    const isPast = new Date(year, month, i) < today;
    
    days.push(
      <button
        key={i}
        disabled={isPast && mode === 'student'}
        onClick={() => handleDayClick(i)}
        className={`h-14 w-full flex flex-col items-center justify-center rounded-2xl text-xs font-bold transition-all relative group
          ${mode === 'hod' || (available && !isPast) ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${available ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'bg-white text-slate-400 border border-slate-50'}
          ${selected ? 'ring-2 ring-emerald-600 ring-offset-2 !bg-emerald-600 !text-white z-10' : 'hover:scale-105'}
          ${isPast ? 'opacity-40 grayscale' : ''}
        `}
      >
        <span className="text-sm font-black">{i}</span>
        {available && !selected && (
            <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Scheduler</span>
           </div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tight">{monthNames[month]} {year}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={nextMonth} className="p-3 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all text-slate-900 border border-slate-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-8">
        {dayLabels.map(label => (
          <div key={label} className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-2">
            {label}
          </div>
        ))}
        {days}
      </div>
      
      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
         <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2.5">
               <div className="w-4 h-4 rounded-lg bg-emerald-600 shadow-sm" />
               <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">In Office / Available</span>
            </div>
            <div className="flex items-center gap-2.5">
               <div className="w-4 h-4 rounded-lg bg-white border border-slate-100 shadow-sm" />
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Out of Office</span>
            </div>
            {mode === 'hod' && (
               <div className="flex items-center gap-2.5 ml-auto text-emerald-600">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Click any date to toggle your presence</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
