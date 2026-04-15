import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  GraduationCap,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your KIU email, staff ID, or student number'),
  password: z.string().min(1, 'Password is required'),
  accessMode: z.enum(['Student', 'Staff']),
});

type LoginForm = z.infer<typeof loginSchema>;

const accessOptions: Array<{
  value: LoginForm['accessMode'];
  label: string;
  icon: typeof GraduationCap;
}> = [
  {
    value: 'Student',
    label: 'Student',
    icon: GraduationCap,
  },
  {
    value: 'Staff',
    label: 'Staff / HOD',
    icon: BriefcaseBusiness,
  },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accessMode: 'Student',
      identifier: '',
      password: '',
    },
  });

  const accessMode = watch('accessMode');

  const onSubmit = async (data: LoginForm) => {
    setApiError('');

    try {
      const payload = {
        identifier: data.identifier.trim(),
        password: data.password,
        role: data.accessMode === 'Student' ? 'Student' : undefined,
      };

      const res = await api.post('/auth/login', payload);

      if (res.data.status === 'success') {
        const { user, token } = res.data;
        login(token, user);

        if (user.role === 'Admin') navigate('/dashboard/admin');
        else if (user.role === 'Staff' || user.role === 'Department Officer') navigate('/dashboard/staff');
        else navigate('/dashboard/student');
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f7] px-4 py-8 sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-[#179b54] p-8 text-white sm:p-10 lg:min-h-[620px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.16),_transparent_28%)]" />
          <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute right-10 top-12 h-24 w-24 rounded-full border border-white/20 bg-white/10" />

          <div className="relative z-10">
            <img src="/kiu-logo.png" alt="Kampala International University" className="h-14 w-auto bg-white/95 p-2 shadow-sm" />
          </div>

          <div className="relative z-10 max-w-sm">
            <div className="mb-6 inline-flex rounded-full border border-white/30 bg-white/10 p-1">
              {accessOptions.map(({ value, label, icon: Icon }) => {
                const isActive = accessMode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('accessMode', value, { shouldValidate: true })}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-white text-[#179b54]' : 'text-white/88 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {accessMode === 'Student' ? 'Student' : 'Staff / HOD'}
            </h1>
          </div>

          <div className="relative z-10 flex gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">SCMS</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">KIU</div>
          </div>
        </section>

        <section className="bg-white p-6 sm:p-10 lg:flex lg:items-center">
          <div className="w-full">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Sign In</p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <input type="hidden" {...register('accessMode')} />

              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-700">
                  {accessMode === 'Student' ? 'Registration Number / Email' : 'Staff ID / Email'}
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  {...register('identifier')}
                  className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#179b54] ${
                    errors.identifier ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder={accessMode === 'Student' ? 'Student account' : 'Staff account'}
                />
                {errors.identifier && (
                  <p className="mt-1.5 flex items-center text-xs text-red-500">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full rounded-2xl border bg-white px-4 py-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#179b54] ${
                      errors.password ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 flex items-center text-xs text-red-500">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#179b54] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-[#128447] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
