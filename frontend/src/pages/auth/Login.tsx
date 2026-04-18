import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, GraduationCap, Briefcase } from 'lucide-react';
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

/**
 * All "admin-class" staff roles share the HOD dashboard.
 * Lecturer gets their own workspace.
 * Everyone else (Student) gets the student portal.
 */
const ADMIN_ROLES = ['HOD'];

function getRoleDashboard(role: string): string {
  if (ADMIN_ROLES.includes(role)) return '/dashboard/hod';
  if (role === 'Lecturer') return '/dashboard/lecturer';
  return '/dashboard/student';
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [userType, setUserType] = useState<'student' | 'staff'>('student');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) navigate(getRoleDashboard(user.role), { replace: true });
  }, [user, navigate]);

  const handleTypeSwitch = (type: 'student' | 'staff') => {
    setUserType(type);
    setApiError('');
    reset();
  };

  const onSubmit = async (values: LoginForm) => {
    setApiError('');
    try {
      const { data } = await api.post('/auth/login', {
        identifier: values.identifier.trim(),
        password: values.password,
      });
      login(data.token, data.user);
      // Backend auto-detects role; redirect accordingly
      navigate(getRoleDashboard(data.user.role), { replace: true });
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-100 bg-cover bg-center bg-no-repeat px-4 py-16 sm:px-8"
      style={{ backgroundImage: `url('/bg-clean.png')` }}
    >
      <div className="relative z-10 w-full max-w-[420px] bg-white p-10 shadow-2xl rounded-sm">
        {/* Logo & Title */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 h-16 w-32">
            <img src="/kiu-logo.png" alt="KIU" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">KIU SCMS</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Student Complaint Management System
          </p>
        </div>

        {/* ── Student / Staff Toggle ── */}
        <div className="mb-7 flex overflow-hidden rounded-sm border border-slate-200">
          <button
            id="type-student"
            type="button"
            onClick={() => handleTypeSwitch('student')}
            className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
              userType === 'student'
                ? 'bg-[#34b05a] text-white shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Student
          </button>
          <div className="w-px bg-slate-200" />
          <button
            id="type-staff"
            type="button"
            onClick={() => handleTypeSwitch('staff')}
            className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
              userType === 'staff'
                ? 'bg-[#34b05a] text-white shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Staff
          </button>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Identifier */}
          <div className="space-y-2">
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder={
                userType === 'student'
                  ? 'Registration No. or Email'
                  : 'Staff No. or Email'
              }
              {...register('identifier')}
              className={`w-full rounded-sm border px-4 py-3.5 text-base text-slate-800 outline-none transition focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a] ${
                errors.identifier ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.identifier && (
              <p className="text-sm font-medium text-rose-600">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                {...register('password')}
                className={`w-full rounded-sm border px-4 py-3.5 pr-12 text-base text-slate-800 outline-none transition focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a] ${
                  errors.password ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-slate-400 transition hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm font-medium text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm bg-[#34b05a] py-4 text-base font-bold text-white transition-colors hover:bg-[#2d9a4e] focus:outline-none focus:ring-2 focus:ring-[#34b05a]/50 disabled:pointer-events-none disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSubmitting
              ? 'Authenticating…'
              : `Sign in as ${userType === 'student' ? 'Student' : 'Staff'}`}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-medium leading-relaxed text-slate-500">
          <p>
            © {new Date().getFullYear()} Kampala International University
            <br />
            Student Complaint Management System
          </p>
          <div className="mt-4">
            <a
              href="/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]"
            >
              Demo Credentials
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
