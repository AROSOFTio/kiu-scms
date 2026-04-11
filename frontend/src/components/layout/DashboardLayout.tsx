import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Settings, Users, Building2, ShieldAlert, BarChart3, ClipboardList, Menu, LogOut, ChevronDown, ShieldCheck, History, Home, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSidebarOpen]);


  // Filter navigation based on role
  
  const navigation = user?.role === 'Admin' ? [
    { name: 'Welcome Home', href: '/dashboard/admin?view=welcome', icon: Home },
    { name: 'Institutional Command', href: '/dashboard/admin?view=command', icon: ShieldCheck },
    { name: 'Activity Logs', href: '/dashboard/admin?view=activity', icon: History },
    { name: 'Grievance Records', href: '/dashboard/admin/complaints', icon: FileText },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Organizational Structure', href: '/dashboard/admin/org', icon: Building2 },
    { name: 'System Configuration', href: '/dashboard/admin/config', icon: Settings },
    { name: 'Audit Logs', href: '/dashboard/admin/logs', icon: ShieldAlert },
    { name: 'Institutional Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
    { name: 'Transparency Board', href: '/dashboard/public-board', icon: BarChart3 },
  ] : user?.role === 'Staff' ? [
    { name: 'Staff Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
    { name: 'Resolution Hub', href: '/dashboard/staff/worklist', icon: ClipboardList },
    { name: 'Transparency Board', href: '/dashboard/public-board', icon: BarChart3 },
  ] : [
    { name: 'My Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'Submit Complaint', href: '/dashboard/student/complaints/new', icon: PlusCircle, color: 'border-[#008540]' },
    { name: 'My Complaints', href: '/dashboard/student/complaints', icon: FileText },
    { name: 'Tracked Cases', href: '/dashboard/student?view=all', icon: Clock },
    { name: 'Resolution Archive', href: '/dashboard/student?view=resolved', icon: CheckCircle },
    { name: 'Transparency Board', href: '/dashboard/public-board', icon: BarChart3 },
  ];

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {/* We use conditional rendering but always apply transition to the backdrop by combining opacity. Wait, react conditional rendering might cut the transition. 
          Given it's a simple fix without breaking the structure, we use the existing conditional standard but add better backdrop-blur. */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-[#1a1a1a] text-slate-300 flex-shrink-0 flex flex-col transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
      `}>
        {/* User Profile Area */}
        <div className="p-6 flex flex-col items-center border-b border-white/5 bg-[#141414]">
          <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-white/10 flex items-center justify-center text-white font-black text-xl shadow-inner mb-4 overflow-hidden">
            {user?.role === 'Student' ? (
               <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100" alt="Profile" className="w-full h-full object-cover" />
            ) : userInitials}
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase leading-tight">{userName}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{user?.role || 'User'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <div className="px-6 text-xs font-bold text-slate-600 mb-4 uppercase tracking-[0.2em]">Main</div>
          <ul className="space-y-0.5">
            {navigation.map((item: any) => {
              const currentFullHref = location.pathname + location.search;
              const isActive = currentFullHref === item.href || (location.pathname === item.href && !location.search);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
                      isActive 
                        ? `text-white bg-white/5 ${item.color || 'border-emerald-500'}` 
                        : `text-slate-400 border-transparent hover:text-white hover:bg-white/5`
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-3 ${isActive && item.color ? item.color.replace('border-', 'text-') : ''}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Brand Footer */}
        <div className="p-4 bg-[#141414]/50 text-center">
             <span className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">KIU SCMS V1.4</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Sticky Header */}
        <header className="sticky top-0 h-[64px] bg-[#222]/95 backdrop-blur-md border-b border-white/5 z-30 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="hidden sm:block p-1 px-2.5 bg-white/5 border border-white/10 rounded mr-3">
                 <Menu className="h-4 w-4 text-slate-500" />
              </div>
              <h1 className="hidden sm:block text-sm font-black text-emerald-500 uppercase tracking-widest">
                Student Complaint and Management System
              </h1>
              <h1 className="sm:hidden text-lg font-black text-emerald-500 uppercase tracking-widest">
                SCMS
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 sm:space-x-6 text-sm font-bold text-slate-300">
            <NotificationDropdown />
            <Link to="/dashboard/profile" className="hidden sm:flex items-center gap-2 hover:text-white transition-colors">
              Change password <ChevronDown className="h-3 w-3" />
            </Link>
            <button 
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <span className="hidden sm:inline">Logout</span> <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Routed Page Container */}
        <main className="flex-1 overflow-y-auto bg-transparent p-6 lg:p-12 text-slate-800 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
