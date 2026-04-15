import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronRight,
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
    return {
      title: 'HOD / Admin',
      subtitle: 'Complaint oversight and routing',
      badge: 'Admin',
    };
  }

  if (role === 'Staff' || role === 'Department Officer') {
    return {
      title: 'Staff / Lecturer',
      subtitle: 'Assigned complaint handling',
      badge: 'Staff',
    };
  }

  return {
    title: 'Student',
    subtitle: 'Complaint submission and tracking',
    badge: 'Student',
  };
}

function getPageMeta(pathname: string) {
  const entries = [
    { match: /^\/dashboard\/student$/, title: 'Student Dashboard', crumbs: ['Dashboard', 'Student'] },
    { match: /^\/dashboard\/student\/complaints\/new$/, title: 'Submit Complaint', crumbs: ['Dashboard', 'Student', 'Submit Complaint'] },
    { match: /^\/dashboard\/student\/complaints\/[^/]+$/, title: 'Complaint Details', crumbs: ['Dashboard', 'Student', 'My Complaints', 'Details'] },
    { match: /^\/dashboard\/student\/complaints$/, title: 'My Complaints', crumbs: ['Dashboard', 'Student', 'My Complaints'] },
    { match: /^\/dashboard\/staff$/, title: 'Staff Workspace', crumbs: ['Dashboard', 'Staff'] },
    { match: /^\/dashboard\/staff\/worklist$/, title: 'Assigned Complaints', crumbs: ['Dashboard', 'Staff', 'Assigned Complaints'] },
    { match: /^\/dashboard\/staff\/complaints\/[^/]+$/, title: 'Complaint Workspace', crumbs: ['Dashboard', 'Staff', 'Assigned Complaints', 'Details'] },
    { match: /^\/dashboard\/admin$/, title: 'HOD Dashboard', crumbs: ['Dashboard', 'HOD'] },
    { match: /^\/dashboard\/admin\/complaints$/, title: 'Complaint Queue', crumbs: ['Dashboard', 'HOD', 'Complaint Queue'] },
    { match: /^\/dashboard\/admin\/reports$/, title: 'Reports', crumbs: ['Dashboard', 'HOD', 'Reports'] },
    { match: /^\/dashboard\/admin\/org$/, title: 'Organisation', crumbs: ['Dashboard', 'HOD', 'Organisation'] },
    { match: /^\/dashboard\/admin\/config$/, title: 'Settings', crumbs: ['Dashboard', 'HOD', 'Settings'] },
    { match: /^\/dashboard\/admin\/logs$/, title: 'Audit Logs', crumbs: ['Dashboard', 'HOD', 'Audit Logs'] },
    { match: /^\/dashboard\/appointments$/, title: 'Appointments', crumbs: ['Dashboard', 'Appointments'] },
  ];

  return entries.find((entry) => entry.match.test(pathname)) ?? { title: 'KIU SCMS', crumbs: ['Dashboard'] };
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
  const pageMeta = getPageMeta(location.pathname);
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

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
    <div className="min-h-screen bg-[var(--kiu-surface)] text-slate-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">KIU SCMS</p>
              <h1 className="text-sm font-semibold text-slate-900">Student Complaint System</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
              <p className="text-xs text-slate-500">{roleMeta.subtitle}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
            {roleMeta.badge}
          </div>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Navigation
          </div>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = isActivePath(location.pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

        <div className="border-t border-slate-100 px-4 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {pageMeta.crumbs.map((crumb, index) => (
                    <div key={`${crumb}-${index}`} className="flex items-center gap-2">
                      {index > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                      <span className={index === pageMeta.crumbs.length - 1 ? 'font-medium text-slate-700' : ''}>{crumb}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="truncate text-lg font-semibold text-slate-900">{pageMeta.title}</h2>
                  <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 sm:inline-flex">
                    {roleMeta.title}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TimeDisplay />
              <NotificationDropdown />
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="text-right leading-tight">
                  <p className="text-sm font-medium text-slate-900">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                  <p className="text-[11px] text-slate-500">{roleMeta.title}</p>
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
