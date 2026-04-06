import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/complaints/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.filter((n: Notification) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/complaints/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-white relative p-1 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#008540] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-black">{unreadCount} New</span>}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-400 font-bold italic">No alerts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors relative group ${!n.is_read ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                        {n.title.toLowerCase().includes('status') ? <Clock className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black uppercase tracking-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      {!n.is_read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="h-6 w-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-primary-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-primary-600 hover:text-white"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-50 text-center bg-gray-50/30">
            <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors">
              Clear All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
