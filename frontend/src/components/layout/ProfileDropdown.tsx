import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Key, User, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group"
      >
        <div className="h-9 w-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white font-black text-xs shadow-inner">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-[11px] font-black uppercase text-white/70 tracking-widest leading-none mb-1">
            {user?.role}
          </p>
          <p className="text-xs font-bold text-white leading-none">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 bg-slate-50/50 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#008540] flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/20">
                {initials}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 tracking-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[140px]">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#008540] rounded-xl transition-all group">
              <User className="h-4 w-4 text-slate-400 group-hover:text-[#008540]" />
              Account Settings
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#008540] rounded-xl transition-all group">
              <Key className="h-4 w-4 text-slate-400 group-hover:text-[#008540]" />
              Change Password
            </button>
            {user?.role === 'Admin' && (
              <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#008540] rounded-xl transition-all group">
                <Shield className="h-4 w-4 text-slate-400 group-hover:text-[#008540]" />
                Security Logs
              </button>
            )}
          </div>

          <div className="p-2 border-t border-slate-50 bg-slate-50/30">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all group"
            >
              <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-600" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
