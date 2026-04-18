import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
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
import { ADMIN_ROLES } from '../../routes';

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

function getNavigation(role?: string): NavigationItem[] {
  if (role && ADMIN_ROLES.includes(role)) {
    return [
      { label: 'Dashboard',       href: '/dashboard/hod',            icon: ShieldCheck   },
      { label: 'Complaint Queue', href: '/dashboard/hod/complaints', icon: ClipboardList },
      { label: 'Reports',         href: '/dashboard/hod/reports',    icon: BarChart3     },
      { label: 'Appointments',    href: '/dashboard/appointments',   icon: CalendarDays  },
    ];
  }

  if (role === 'Lecturer') {
    return [
      { label: 'Worklist',     href: '/dashboard/lecturer',       icon: LayoutDashboard },
      { label: 'Appointments', href: '/dashboard/appointments',   icon: CalendarDays    },
    ];
  }

  // Student (default)
  return [
    { label: 'Dashboard',        href: '/dashboard/student',                icon: LayoutDashboard },
    { label: 'Submit Complaint', href: '/dashboard/student/complaints/new', icon: FilePlus2       },
    { label: 'My Complaints',    href: '/dashboard/student/complaints',     icon: FileText        },
    { label: 'Appointments',     href: '/dashboard/appointments',           icon: CalendarDays    },
  ];
}

function getRoleMeta(role?: string) {
  if (role && ADMIN_ROLES.includes(role)) {
    // Show the actual role name for non-HOD admin-class users
    const label = role === 'HOD' || role === 'SuperAdmin' ? 'HOD' : role;
    return { title: label, badge: label };
  }
  if (role === 'Lecturer') return { title: 'Lecturer', badge: 'Lecturer' };
  return { title: 'Student', badge: 'Student' };
}

function getPageTitle(pathname: string) {
  const entries = [
    // Student
    { match: /^\/dashboard\/student$/,                    title: 'Dashboard'         },
    { match: /^\/dashboard\/student\/complaints\/new$/,   title: 'Submit Complaint'  },
    { match: /^\/dashboard\/student\/complaints\/[^/]+$/, title: 'Complaint Details' },
    { match: /^\/dashboard\/student\/complaints$/,        title: 'My Complaints'     },
    // HOD / Admin
    { match: /^\/dashboard\/hod$/,                        title: 'HOD Dashboard'     },
    { match: /^\/dashboard\/hod\/complaints$/,            title: 'Complaint Queue'   },
    { match: /^\/dashboard\/hod\/complaints\/[^/]+$/,     title: 'Complaint Details' },
    { match: /^\/dashboard\/hod\/reports$/,               title: 'Reports'           },
    // Lecturer
    { match: /^\/dashboard\/lecturer$/,                   title: 'Worklist'          },
    { match: /^\/dashboard\/lecturer\/complaints\/[^/]+$/, title: 'Complaint Details'},
    // Shared
    { match: /^\/dashboard\/appointments$/,               title: 'Appointments'      },
  ];

  return entries.find((entry) => entry.match.test(pathname))?.title ?? 'Dashboard';
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout() {
  const location   = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = getNavigation(user?.role);
  const roleMeta   = getRoleMeta(user?.role);
  const pageTitle  = getPageTitle(location.pathname);

  // All admin-class roles share the dark HOD workspace UI
  const isHODRole = !!(user?.role && ADMIN_ROLES.includes(user.role));

  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSidebarOpen]);

  return (
    <div className={`min-h-screen text-slate-900 ${isHODRole ? 'bg-[#292929]' : 'bg-[#eef1f4]'}`}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${isHODRole ? 'w-[310px]' : 'w-72'} bg-[#292929] flex-col text-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`relative ${isHODRole ? 'border-b border-white/10 px-5 py-6' : 'border-b border-white/8 px-6 py-5'}`}>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#33b35a]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center bg-white p-2.5 shadow-sm ${isHODRole ? 'h-16 w-16 rounded-[20px]' : 'h-14 w-14 rounded-[18px]'}`}>
                <img src="/kiu-logo.png" alt="Kampala International University" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">KIU</p>
                <h1 className={`${isHODRole ? 'max-w-[150px] text-base leading-tight' : 'text-sm'} font-semibold text-white`}>
                  Student Complaint System
                </h1>
                {isHODRole && (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
                    {user?.role === 'Lecturer' ? 'Lecturer Workspace' : 'Staff Control'}
                  </p>
                )}
                {user?.role === 'Lecturer' && (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/55">Lecturer Workspace</p>
                )}
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

        <nav className={`flex-1 ${isHODRole ? 'px-4 py-6' : 'px-4 py-5'}`}>
          <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {isHODRole ? 'Command' : 'Navigation'}
          </div>
          <ul className="space-y-2.5">
            {navigation.map((item) => {
              const active = isActivePath(location.pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-sm transition ${
                      isHODRole
                        ? active
                          ? 'bg-[#393836] text-white shadow-[inset_4px_0_0_0_#33b35a,0_16px_34px_-24px_rgba(0,0,0,0.8)]'
                          : 'text-white/80 hover:bg-white/8 hover:text-white'
                        : active
                          ? 'bg-[#393836] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                          : 'text-white/82 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                    {isHODRole && <ChevronRight className={`ml-auto h-4 w-4 ${active ? 'text-white' : 'text-white/55'}`} />}
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

      <div className={isHODRole ? 'bg-[#292929] lg:pl-[310px]' : 'lg:pl-72'}>
        <header className={`sticky top-0 z-30 text-white ${isHODRole ? 'bg-[#292929] shadow-[0_18px_40px_-28px_rgba(17,17,17,0.82)]' : 'border-b border-[#393836] bg-[#292929]'}`}>
          <div className={`mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 ${isHODRole ? 'h-20 max-w-none' : 'h-20 max-w-7xl'}`}>
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/12 bg-white/8 text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                {isHODRole ? (
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold uppercase tracking-[0.16em] text-white/72">
                      KIU · Staff Complaint Oversight
                    </p>
                    <h2 className="truncate text-[24px] font-bold text-white">{pageTitle}</h2>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h2 className="truncate text-[22px] font-semibold text-white">{pageTitle}</h2>
                    <span className="hidden rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/72 sm:inline-flex">
                      {roleMeta.title}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TimeDisplay />
              <NotificationDropdown />
              <div className={`hidden items-center gap-3 rounded-[18px] border border-white/12 px-3 py-2 md:flex ${isHODRole ? 'bg-white/10' : 'bg-white/8'}`}>
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

        <div className="bg-[#292929] pt-1">
          <div className="min-h-[calc(100vh-81px)] overflow-hidden bg-[#eef1f4] lg:rounded-tl-[42px]">
            <main className={`${isHODRole ? 'bg-[#eef1f4] px-4 py-5 sm:px-6 lg:px-8' : 'bg-[#eef1f4] px-4 py-6 sm:px-6 lg:px-8'}`}>
              <div className={`mx-auto w-full space-y-6 ${isHODRole ? 'max-w-none' : 'max-w-7xl'}`}>
                {isHODRole && (
                  <div className="overflow-hidden rounded-[18px] border border-[#d9e2dc] bg-white shadow-[0_18px_48px_-34px_rgba(41,41,41,0.22)]">
                    <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
                      <div className="h-12 w-1 rounded-full bg-[#33b35a]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6e7a72]">Staff Workspace</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-[22px] font-semibold text-[#292929]">{pageTitle}</h3>
                          <span className="text-sm font-medium text-[#33b35a]">Complaint review, routing and lecturer assignment</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
