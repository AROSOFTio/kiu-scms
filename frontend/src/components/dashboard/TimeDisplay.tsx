import { useState, useEffect } from 'react';

export default function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/10 px-4 py-2.5">
      <div className="h-2 w-2 rounded-full bg-[#34b05a]" />
      <div className="text-right leading-tight">
        <div className="text-[11px] font-medium text-white/65">
          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        <div className="text-sm font-semibold text-white tabular-nums">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    </div>
  );
}
