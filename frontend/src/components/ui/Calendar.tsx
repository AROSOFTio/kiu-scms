import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  availableDays: string[]; // ['Monday', 'Wednesday']
  selectedDate: Date | null;
}

export default function Calendar({ onDateSelect, availableDays, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    const date = new Date(year, month, day);
    if (date < today) return false;
    const dayName = fullDays[date.getDay()];
    return availableDays.includes(dayName);
  };

  const days = [];
  for (let i = 0; i < offset; i++) days.push(<div key={`empty-${i}`} />);
  for (let i = 1; i <= totalDays; i++) {
    const available = isAvailable(i);
    const selected = isSelected(i);
    
    days.push(
      <button
        key={i}
        disabled={!available}
        onClick={() => onDateSelect(new Date(year, month, i))}
        className={`h-12 w-full flex items-center justify-center rounded-2xl text-sm font-bold transition-all
          ${available ? 'hover:bg-emerald-50 text-slate-900 cursor-pointer hover:border-emerald-200 border border-transparent' : 'text-slate-300 cursor-not-allowed'}
          ${selected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700' : ''}
          ${available && !selected ? 'bg-white shadow-sm border-slate-100' : ''}
        `}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayLabels.map(label => (
          <div key={label} className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-2">
            {label}
          </div>
        ))}
        {days}
      </div>
      
      <div className="mt-8 flex items-center gap-6 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Office Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-100" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Not Available</span>
        </div>
      </div>
    </div>
  );
}
