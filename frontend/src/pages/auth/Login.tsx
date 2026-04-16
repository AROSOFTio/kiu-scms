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
    label: 'Staff',
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
    <div className="min-h-screen bg-[#f4f5f7] px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-8">
      <div className="animate-slide-up w-full max-w-[980px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_60px_-36px_rgba(41,41,41,0.18)] lg:grid lg:grid-cols-[0.96fr_1fr]">
        <section className="relative flex min-h-[240px] flex-col justify-between overflow-hidden bg-[#292929] p-7 text-white sm:p-8 lg:min-h-[540px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(52,176,90,0.18),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_24%)]" />

          <div className="relative z-10 self-start">
            <div className="rounded-[18px] bg-white p-3 shadow-[0_16px_32px_rgba(0,0,0,0.16)]">
              <img src="/kiu-logo.png" alt="Kampala International University" className="h-10 w-auto object-contain" />
            </div>
          </div>

          <div className="relative z-10 max-w-sm">
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 p-1">
              {accessOptions.map(({ value, label, icon: Icon }) => {
                const isActive = accessMode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('accessMode', value, { shouldValidate: true })}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-300 ${
                      isActive ? 'bg-white text-[#34b05a] shadow-sm' : 'text-white/88 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            <h1 className="text-[2rem] font-semibold tracking-tight sm:text-[2.25rem]">KIU Complaint System</h1>
            <p className="mt-3 text-sm leading-6 text-white/68">
              {accessMode === 'Student' ? 'Student access' : 'Staff and lecturer access'}
            </p>
          </div>

          <div className="relative z-10 flex gap-3">
            <div className="rounded-[16px] border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm">KIU</div>
            <div className="rounded-[16px] border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm">SCMS</div>
          </div>
        </section>

        <section className="bg-white p-6 sm:p-8 lg:flex lg:items-center">
          <div className="w-full">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Sign in</p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  className={`w-full rounded-[18px] border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#34b05a] focus:ring-4 focus:ring-[#34b05a]/10 ${
                    errors.identifier ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder={accessMode === 'Student' ? 'Student number or email' : 'Staff ID or email'}
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
                    className={`w-full rounded-[18px] border bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#34b05a] focus:ring-4 focus:ring-[#34b05a]/10 ${
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#34b05a] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#2d9a4e] hover:shadow-[0_16px_30px_rgba(52,176,90,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
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
