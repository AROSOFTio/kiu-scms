import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  onToggleAvailability?: (date: string, isAvailable: boolean) => void;
  availableDates: string[]; // ['2026-04-12', '2026-04-15']
  selectedDate: Date | null;
  mode: 'student' | 'office';
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
    
    if (mode === 'office' && onToggleAvailability) {
      onToggleAvailability(dateStr, !isAvailable(day));
    } else {
      if (isAvailable(day) || mode === 'office') {
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
        className={`relative flex h-11 w-full flex-col items-center justify-center rounded-[16px] border text-xs font-semibold transition
          ${mode === 'office' || (available && !isPast) ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${available ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}
          ${selected ? 'z-10 border-[#34b05a] bg-[#34b05a] text-white ring-2 ring-[#34b05a]/20' : 'hover:border-slate-300'}
          ${isPast ? 'opacity-40 grayscale' : ''}
        `}
      >
        <span className="text-sm font-semibold">{i}</span>
        {available && !selected && (
            <div className="mt-1 h-1 w-1 rounded-full bg-emerald-500" />
        )}
      </button>
    );
  }

  return (
    <div className="app-card p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
           <div className="mb-1 flex items-center gap-2 text-[#34b05a]">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Calendar</span>
           </div>
           <h3 className="text-xl font-semibold text-slate-900">{monthNames[month]} {year}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextMonth} className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-2">
        {dayLabels.map(label => (
          <div key={label} className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </div>
        ))}
        {days}
      </div>
      
      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
         <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2.5">
               <div className="h-3.5 w-3.5 rounded-md bg-[#34b05a]" />
               <span className="text-[11px] font-medium text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2.5">
               <div className="h-3.5 w-3.5 rounded-md border border-slate-200 bg-white" />
               <span className="text-[11px] font-medium text-slate-500">Unavailable</span>
            </div>
            {mode === 'office' && (
               <div className="ml-auto flex items-center gap-2 text-[#34b05a]">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px] font-medium">Select a date to update availability.</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
