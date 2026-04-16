import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TimeDisplay from '../dashboard/TimeDisplay';
import NotificationDropdown from './NotificationDropdown';

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

function getNavigation(role?: string): NavigationItem[] {
  if (role === 'Admin') {
    return [
      { label: 'Dashboard', href: '/dashboard/admin', icon: ShieldCheck },
      { label: 'Complaint Queue', href: '/dashboard/admin/complaints', icon: ClipboardList },
      { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
      { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
    ];
  }

  if (role === 'Staff' || role === 'Department Officer') {
    return [
      { label: 'Workspace', href: '/dashboard/staff', icon: LayoutDashboard },
      { label: 'Assigned Complaints', href: '/dashboard/staff/worklist', icon: ClipboardList },
      { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
    ];
  }

  return [
    { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { label: 'Submit Complaint', href: '/dashboard/student/complaints/new', icon: FilePlus2 },
    { label: 'My Complaints', href: '/dashboard/student/complaints', icon: FileText },
    { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
  ];
}

function getRoleMeta(role?: string) {
  if (role === 'Admin') {
    return { title: 'Admin', badge: 'Admin' };
  }

  if (role === 'Staff' || role === 'Department Officer') {
    return { title: 'Staff / Lecturer', badge: 'Staff' };
  }

  return { title: 'Student', badge: 'Student' };
}

function getPageTitle(pathname: string) {
  const entries = [
    { match: /^\/dashboard\/student$/, title: 'Dashboard' },
    { match: /^\/dashboard\/student\/complaints\/new$/, title: 'Submit Complaint' },
    { match: /^\/dashboard\/student\/complaints\/[^/]+$/, title: 'Complaint Details' },
    { match: /^\/dashboard\/student\/complaints$/, title: 'My Complaints' },
    { match: /^\/dashboard\/staff$/, title: 'Workspace' },
    { match: /^\/dashboard\/staff\/worklist$/, title: 'Assigned Complaints' },
    { match: /^\/dashboard\/staff\/complaints\/[^/]+$/, title: 'Complaint Workspace' },
    { match: /^\/dashboard\/admin$/, title: 'Dashboard' },
    { match: /^\/dashboard\/admin\/complaints$/, title: 'Complaint Queue' },
    { match: /^\/dashboard\/admin\/complaints\/[^/]+$/, title: 'Complaint Workspace' },
    { match: /^\/dashboard\/admin\/reports$/, title: 'Reports' },
    { match: /^\/dashboard\/appointments$/, title: 'Appointments' },
  ];

  return entries.find((entry) => entry.match.test(pathname))?.title ?? 'Dashboard';
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = getNavigation(user?.role);
  const roleMeta = getRoleMeta(user?.role);
  const pageTitle = getPageTitle(location.pathname);
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#eef1f4] text-slate-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#292929] text-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative border-b border-white/8 px-6 py-5">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#34b05a]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white p-2.5 shadow-sm">
                <img src="/kiu-logo.png" alt="Kampala International University" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">KIU</p>
                <h1 className="text-sm font-semibold text-white">Student Complaint System</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Navigation
          </div>
          <ul className="space-y-2.5">
            {navigation.map((item) => {
              const active = isActivePath(location.pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-sm transition ${
                      active
                        ? 'bg-[#393836] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                        : 'text-white/82 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/8 px-4 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3.5 text-sm font-medium text-white/72 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#393836] bg-[#292929] text-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/12 bg-white/8 text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="truncate text-[22px] font-semibold text-white">{pageTitle}</h2>
                  <span className="hidden rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/72 sm:inline-flex">
                    {roleMeta.title}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TimeDisplay />
              <NotificationDropdown />
              <div className="hidden items-center gap-3 rounded-[18px] border border-white/12 bg-white/8 px-3 py-2 md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="text-right leading-tight">
                  <p className="text-sm font-medium text-white">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                  <p className="text-[11px] text-white/70">{roleMeta.title}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
