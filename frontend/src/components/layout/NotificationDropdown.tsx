import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../../lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/complaints/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
      >
        <Bell className={`h-4.5 w-4.5 transition-colors ${isOpen ? 'text-emerald-500' : 'text-slate-400 group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-600 border-2 border-[#222] rounded-full flex items-center justify-center text-[7px] font-black text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-5 border-b border-white/5 bg-[#252525]">
             <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Automated Alerts</h3>
                <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">Institutional Feed</span>
             </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center">
                 <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Syncing Telemetry...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center opacity-30">
                 <CheckCircle2 className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zero active alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer group relative ${!n.is_read ? 'bg-emerald-500/5' : ''}`}
                  >
                    {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                    <div className="flex gap-4">
                       <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                         n.title.includes('Received') ? 'bg-blue-500/10 text-blue-500' : 
                         n.title.includes('Progress') ? 'bg-amber-500/10 text-amber-500' :
                         'bg-emerald-500/10 text-emerald-500'
                       }`}>
                          {n.title.includes('Received') ? <MessageSquare className="h-4 w-4" /> :
                           n.title.includes('Progress') ? <Clock className="h-4 w-4" /> :
                           <CheckCircle2 className="h-4 w-4" />}
                       </div>
                       <div className="min-w-0">
                          <p className={`text-[11px] font-black text-white tracking-widest uppercase mb-1 ${!n.is_read ? 'opacity-100' : 'opacity-60'}`}>{n.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-3">{n.message}</p>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter flex items-center">
                            <Clock className="h-2.5 w-2.5 mr-1" /> {new Date(n.created_at).toLocaleString()}
                          </p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 text-center bg-[#181818]">
             <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Clear All History</button>
          </div>
        </div>
      )}
    </div>
  );
}
