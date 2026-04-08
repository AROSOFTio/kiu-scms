import { useState, useEffect } from 'react';

export default function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000); // Update every second for neatness

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-[32px] md:text-[40px] font-black text-slate-900 tracking-tighter tabular-nums leading-none">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}
