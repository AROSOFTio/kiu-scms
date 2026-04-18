import { useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle,
  Copy,
  GraduationCap,
  Hash,
  Mail,
  Search,
  Users,
} from 'lucide-react';
import { DEMO_PASSWORD, demoDepartments, demoUsers, type DemoRole, type DemoUser } from '../data/demoUsers';

const roleStyles: Record<DemoRole, string> = {
  HOD: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Lecturer: 'bg-amber-50 text-amber-700 border-amber-200',
  Student: 'bg-blue-50 text-blue-700 border-blue-200',
};

const getRoleIcon = (role: DemoRole) => {
  if (role === 'HOD') return <Briefcase className="h-4 w-4" />;
  if (role === 'Lecturer') return <Users className="h-4 w-4" />;
  return <GraduationCap className="h-4 w-4" />;
};

const getIdentifierLabel = (role: DemoRole) => (role === 'Student' ? 'Student No.' : 'Staff No.');

function FieldButton({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-[#34b05a]/35 hover:bg-emerald-50/50"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-1 truncate font-mono text-xs text-slate-700">{value}</p>
      </div>
      {copied ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#34b05a]" />
      ) : (
        <Copy className="h-4 w-4 flex-shrink-0 text-slate-400" />
      )}
    </button>
  );
}

function UserCard({
  user,
  copied,
  onCopy,
}: {
  user: DemoUser;
  copied: string | null;
  onCopy: (value: string, key?: string) => void;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">{user.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{user.department}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${roleStyles[user.role]}`}>
          {getRoleIcon(user.role)}
          {user.role}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        <FieldButton
          label="Email"
          value={user.email}
          copied={copied === user.email}
          onCopy={() => onCopy(user.email)}
        />
        <FieldButton
          label={getIdentifierLabel(user.role)}
          value={user.identifier}
          copied={copied === user.identifier}
          onCopy={() => onCopy(user.identifier)}
        />
        <FieldButton
          label="Password"
          value={user.password}
          copied={copied === `${user.email}:password`}
          onCopy={() => onCopy(user.password, `${user.email}:password`)}
        />
      </div>
    </article>
  );
}

export default function Credentials() {
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleCopy = (value: string, key = value) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return demoDepartments;

    return demoDepartments
      .map((group) => {
        const users = [group.hod, ...group.lecturers, ...group.students].filter((user) => {
          const haystack = [
            user.name,
            user.email,
            user.role,
            user.department,
            user.faculty,
            user.identifier,
          ].join(' ').toLowerCase();
          return haystack.includes(term);
        });

        if (!users.length) return null;

        return {
          ...group,
          hod: users.find((user) => user.role === 'HOD') || group.hod,
          lecturers: users.filter((user) => user.role === 'Lecturer'),
          students: users.filter((user) => user.role === 'Student'),
          visibleUsers: users,
        };
      })
      .filter(Boolean) as Array<(typeof demoDepartments)[number] & { visibleUsers: DemoUser[] }>;
  }, [search]);

  const totals = {
    hods: demoUsers.filter((user) => user.role === 'HOD').length,
    lecturers: demoUsers.filter((user) => user.role === 'Lecturer').length,
    students: demoUsers.filter((user) => user.role === 'Student').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <Users className="h-4 w-4" />
                Demo Login Matrix
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">System Credentials</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                  Every seeded user is listed here. Sign in with either the account email or the shown staff/student number.
                  All accounts use the same password: <span className="font-mono font-semibold text-slate-700">{DEMO_PASSWORD}</span>.
                </p>
              </div>
            </div>

            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-[16px] bg-[#34b05a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d9a4e]"
            >
              Back to Login
            </a>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(3,160px)]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, role, department, or ID number"
                className="w-full rounded-[16px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white"
              />
            </label>

            {[
              { label: 'HODs', value: totals.hods, icon: Briefcase, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Lecturers', value: totals.lecturers, icon: Users, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Students', value: totals.students, icon: GraduationCap, tone: 'bg-blue-50 text-blue-700 border-blue-200' },
            ].map((item) => (
              <div key={item.label} className={`rounded-[18px] border px-4 py-3 ${item.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <item.icon className="h-5 w-5" />
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {filteredDepartments.map((group) => {
          const visibleUsers = 'visibleUsers' in group
            ? group.visibleUsers
            : [group.hod, ...group.lecturers, ...group.students];

          return (
            <section key={group.department} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{group.faculty}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{group.department}</h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Mail className="h-4 w-4" />
                  <span>{visibleUsers.length} account{visibleUsers.length === 1 ? '' : 's'} shown</span>
                  <span className="text-slate-300">|</span>
                  <Hash className="h-4 w-4" />
                  <span>Copy email or ID to sign in</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[group.hod, ...group.lecturers, ...group.students]
                  .filter((user) => visibleUsers.some((visible) => visible.email === user.email))
                  .map((user) => (
                    <UserCard
                      key={user.email}
                      user={user}
                      copied={copied}
                      onCopy={handleCopy}
                    />
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
