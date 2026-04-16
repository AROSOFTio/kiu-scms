import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
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
    } catch {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
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
    } catch {
      console.error('Failed to mark read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/15 bg-white/10 text-white/75 transition hover:text-white"
      >
        <Bell className={`h-4 w-4 transition-colors ${isOpen ? 'text-[#34b05a]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#34b05a] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-4 w-[360px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_68px_-32px_rgba(41,41,41,0.28)]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#292929]">Alerts</h3>
              </div>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#34b05a]/10 px-2.5 py-1 text-[10px] font-semibold text-[#34b05a]">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[#34b05a] border-t-transparent" />
                <p className="text-xs text-slate-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`relative cursor-pointer px-5 py-4 transition hover:bg-slate-50 ${!n.is_read ? 'bg-[#34b05a]/5' : ''}`}
                  >
                    {!n.is_read && <div className="absolute inset-y-0 left-0 w-1 bg-[#34b05a]" />}
                    <div className="flex gap-4">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                        n.title.includes('Received') ? 'bg-blue-50 text-blue-600' :
                        n.title.includes('Progress') ? 'bg-amber-50 text-amber-600' :
                        'bg-[#34b05a]/10 text-[#34b05a]'
                      }`}>
                        {n.title.includes('Received') ? <MessageSquare className="h-4 w-4" /> :
                         n.title.includes('Progress') ? <Clock className="h-4 w-4" /> :
                         <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-sm font-medium text-slate-900">{n.title}</p>
                        <p className="mb-2 text-xs leading-relaxed text-slate-600">{n.message}</p>
                        <p className="flex items-center text-[11px] text-slate-400">
                          <Clock className="mr-1 h-3 w-3" /> {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
