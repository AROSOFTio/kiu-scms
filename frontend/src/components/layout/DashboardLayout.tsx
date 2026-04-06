import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Settings, Users, Building2, ShieldAlert, BarChart3, ClipboardList, Menu, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import ProfileDropdown from './ProfileDropdown';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);


  // Filter navigation based on role
  
  const navigation = user?.role === 'Admin' ? [
    { name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Grievance Records', href: '/dashboard/admin/complaints', icon: FileText },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Organizational Structure', href: '/dashboard/admin/org', icon: Building2 },
    { name: 'System Configuration', href: '/dashboard/admin/config', icon: Settings },
    { name: 'Audit Logs', href: '/dashboard/admin/logs', icon: ShieldAlert },
    { name: 'Institutional Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
  ] : user?.role === 'Staff' ? [
    { name: 'Staff Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
    { name: 'Resolution Hub', href: '/dashboard/staff/worklist', icon: ClipboardList },
  ] : [
    { name: 'My Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'My Complaints', href: '/dashboard/student/complaints', icon: FileText },
    { name: 'New Complaint', href: '/dashboard/student/complaints/new', icon: PlusCircle },
  ];

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#08271c] text-slate-100 flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* User Profile Card */}
        <div className="p-8 flex flex-col items-center border-b border-[#12553a] bg-[#061d15]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-400 to-green-600 rounded-[2rem] blur-sm opacity-25 group-hover:opacity-50 transition-opacity" />
            <div className="relative w-20 h-20 rounded-[2rem] bg-[#12553a] border border-[#1d8a5e]/30 flex items-center justify-center text-white font-black text-2xl shadow-2xl transition-all group-hover:scale-105 duration-500">
              {userInitials}
            </div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-white font-black text-base tracking-tight uppercase">{userName}</h3>
            <p className="text-[10px] font-black text-emerald-400 mt-1 uppercase tracking-[0.2em]">{user?.role || 'User'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 overflow-y-auto custom-scrollbar">
          <div className="px-8 text-[10px] font-black text-emerald-600/60 mb-6 uppercase tracking-[0.3em]">System Navigator</div>
          <ul className="space-y-2 px-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 group ${
                      isActive 
                        ? 'text-white bg-[#104631] shadow-xl shadow-black/20 translate-x-2' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Brand Footer */}
        <div className="p-6 border-t border-[#12553a] bg-[#061d15]/50">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">KIU Institutional V1.4</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Sticky Header */}
        <header className="h-20 lg:h-24 glass-effect sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 border-b border-slate-100/50 shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] leading-none mb-1">Kampala International University</span>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">SCMS <span className="text-emerald-600">Portal</span></h1>
            </div>
            {/* Small screen brand */}
            <div className="sm:hidden font-black text-xl text-slate-900 tracking-tighter">SCMS</div>
          </div>
          
          <div className="flex items-center space-x-3 lg:space-x-6">
            <NotificationCenter />
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
            <ProfileDropdown />
          </div>
        </header>

        {/* Routed Page Container */}
        <main className="flex-1 overflow-y-auto bg-[#fdfdfd] p-6 lg:p-12 text-slate-800 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
