import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div
      className="flex min-h-screen items-center justify-center bg-[#1c1c1e] bg-cover bg-center bg-no-repeat px-4 py-16 sm:px-8 relative"
      style={{ backgroundImage: `url('/kiu-campus-login.jpg')` }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-[#002f12]/60 mix-blend-multiply" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Branding header centered */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white p-3 shadow-2xl ring-4 ring-white/10">
            <img src="/kiu-logo.png" alt="KIU" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              KIU SCMS
            </h1>
            <p className="mt-1 text-sm font-medium text-white/80 drop-shadow-md">
              Student Complaint Management System
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-[24px] border border-white/20 bg-white/95 p-8 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-slate-800">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in with your structural identity (Email, Student No., or Staff No.)
            </p>
          </div>

          {apiError && (
            <div className="mb-5 rounded-[16px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Identifier */}
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-semibold tracking-wide text-slate-700">
                Identifier ID
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="Student No, Email, or Staff ID"
                {...register('identifier')}
                className={`w-full rounded-[16px] border bg-[#f8fafb] px-5 py-3.5 text-base font-medium text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white focus:ring-4 focus:ring-[#34b05a]/10 ${
                  errors.identifier ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {errors.identifier && (
                <p className="text-sm font-medium text-rose-500">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold tracking-wide text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your secure password"
                  {...register('password')}
                  className={`w-full rounded-[16px] border bg-[#f8fafb] px-5 py-3.5 pr-12 text-base font-medium text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white focus:ring-4 focus:ring-[#34b05a]/10 ${
                    errors.password ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm font-medium text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[16px] bg-[#34b05a] py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-[#34b05a]/20 transition-all hover:-translate-y-0.5 hover:bg-[#2d9a4e] hover:shadow-xl hover:shadow-[#34b05a]/30 focus:outline-none focus:ring-4 focus:ring-[#34b05a]/30 disabled:pointer-events-none disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Authenticating…' : 'Sign in securely'}
            </button>
          </form>

          {/* Dummy Info */}
          <div className="mt-8 rounded-[16px] border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-amber-700">Demo Access</p>
            <div className="flex justify-between text-sm font-medium text-amber-900/90 leading-relaxed">
              <div className="space-y-1">
                <p><span className="font-extrabold text-amber-900">HOD:</span> hod.cs@kiu.ac.ug</p>
                <p><span className="font-extrabold text-amber-900">Lec:</span> lec.cs@kiu.ac.ug</p>
              </div>
              <div className="text-right space-y-1">
                <p><span className="font-extrabold text-amber-900">Stu:</span> student.cs1@...ug</p>
                <p className="text-amber-800 font-bold uppercase tracking-wide bg-amber-200/50 inline-block px-2 py-0.5 rounded">Admin@123</p>
              </div>
            </div>
          </div>

        </div>

        <p className="mt-8 text-center text-[11px] font-medium tracking-wide text-white/50">
          © {new Date().getFullYear()} Kampala International University
          <br />Student Complaint Management System
        </p>
      </div>
    </div>
  );
}
