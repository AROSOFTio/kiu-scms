import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email or ID number'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function getRoleDashboard(role: string): string {
  if (role === 'HOD') return '/dashboard/hod';
  if (role === 'Lecturer') return '/dashboard/lecturer';
  if (role === 'SuperAdmin') return '/dashboard/hod';
  return '/dashboard/student';
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) navigate(getRoleDashboard(user.role), { replace: true });
  }, [user, navigate]);

  const onSubmit = async (values: LoginForm) => {
    setApiError('');
    try {
      const { data } = await api.post('/auth/login', {
        identifier: values.identifier.trim(),
        password: values.password,
      });
      login(data.token, data.user);
      navigate(getRoleDashboard(data.user.role), { replace: true });
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Branding panel */}
      <div className="hidden flex-col justify-between bg-[#1c1c1e] p-10 lg:flex lg:w-[44%]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white p-2.5 shadow-sm">
            <img src="/kiu-logo.png" alt="Kampala International University" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">KIU</p>
            <p className="text-sm font-semibold text-white">Student Complaint System</p>
          </div>
        </div>

        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-[#34b05a]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Secure Portal Access</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            KIU Complaint<br />Management
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            A structured platform for students to formally lodge complaints and for departmental
            HODs and Lecturers to review, assign, and resolve them efficiently.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Faculties', value: '3' },
              { label: 'Departments', value: '9' },
              { label: 'Complaint Channel', value: '6' },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] border border-white/10 bg-white/6 p-4">
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} Kampala International University. All rights reserved.
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center bg-[#f0f2f5] px-4 py-16 sm:px-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1c1c1e] p-2">
              <img src="/kiu-logo.png" alt="KIU" className="h-full w-full object-contain" />
            </div>
            <p className="text-base font-bold text-[#1c1c1e]">KIU SCMS</p>
          </div>

          <div className="rounded-[24px] border border-[#dde3ea] bg-white p-8 shadow-[0_28px_64px_-40px_rgba(17,17,17,0.22)]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1c1c1e]">Sign in</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Use your KIU email, student number, or staff number
              </p>
            </div>

            {apiError && (
              <div className="mb-5 rounded-[16px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Identifier */}
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email / Student No. / Staff No.
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. student.cs1@student.kiu.ac.ug"
                  {...register('identifier')}
                  className={`w-full rounded-[16px] border bg-[#f8fafb] px-4 py-3 text-sm text-slate-900 outline-none transition
                    focus:border-[#34b05a] focus:bg-white
                    ${errors.identifier ? 'border-rose-300 bg-rose-50' : 'border-[#dde3ea]'}`}
                />
                {errors.identifier && (
                  <p className="text-xs text-rose-500">{errors.identifier.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className={`w-full rounded-[16px] border bg-[#f8fafb] px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition
                      focus:border-[#34b05a] focus:bg-white
                      ${errors.password ? 'border-rose-300 bg-rose-50' : 'border-[#dde3ea]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500">{errors.password.message}</p>
                )}
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-[16px] bg-[#34b05a] py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d9a4e] focus:outline-none focus:ring-2 focus:ring-[#34b05a]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 rounded-[16px] border border-[#e8edf2] bg-[#f7f9fb] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Demo accounts</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">HOD:</span> hod.cs@kiu.ac.ug</p>
                <p><span className="font-medium text-slate-700">Lecturer:</span> lec.cs@kiu.ac.ug</p>
                <p><span className="font-medium text-slate-700">Student:</span> student.cs1@student.kiu.ac.ug</p>
                <p className="pt-1 text-slate-400">Password: <span className="font-medium text-slate-500">Admin@123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
