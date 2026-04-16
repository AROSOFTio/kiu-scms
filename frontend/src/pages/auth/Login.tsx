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
  hint: string;
}> = [
  {
    value: 'Student',
    label: 'Student',
    icon: GraduationCap,
    hint: 'Student account',
  },
  {
    value: 'Staff',
    label: 'Staff',
    icon: BriefcaseBusiness,
    hint: 'Lecturer / HOD',
  },
];

const campusBackground = '/kiu-campus-login.jpg';

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

        if (user.role === 'Admin' || user.role === 'Department Officer') navigate('/dashboard/admin');
        else if (user.role === 'Staff') navigate('/dashboard/staff');
        else navigate('/dashboard/student');
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `linear-gradient(rgba(41,41,41,0.4), rgba(41,41,41,0.32)), url(${campusBackground})` }}
    >
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-8">
        <div className="animate-slide-up w-full max-w-[470px] overflow-hidden rounded-[24px] border border-white/25 bg-white shadow-[0_36px_80px_-42px_rgba(0,0,0,0.48)] backdrop-blur-[2px]">
          <section className="border-b border-[#e4e8e5] bg-white px-8 pb-7 pt-8 text-center">
            <div className="mx-auto mb-5 flex w-fit items-center justify-center rounded-[22px] bg-white px-7 py-5">
              <img
                src="/kiu-logo.png"
                alt="Kampala International University"
                className="h-[88px] w-auto max-w-[260px] object-contain"
              />
            </div>
            <h1 className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[#292929]">Student Complaint System</h1>
            <p className="mt-1 text-sm text-[#5d655f]">Sign in to continue</p>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-[18px] bg-[#f1f4f2] p-1.5">
              {accessOptions.map(({ value, label, icon: Icon, hint }) => {
                const isActive = accessMode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('accessMode', value, { shouldValidate: true })}
                    className={`rounded-[14px] px-3 py-3 text-left transition-all duration-300 ${
                      isActive ? 'bg-[#33b35a] text-white shadow-[0_18px_30px_-24px_rgba(51,179,90,0.65)]' : 'text-[#292929] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    <p className={`mt-1 text-xs ${isActive ? 'text-white/90' : 'text-[#5d655f]'}`}>{hint}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white px-8 py-7">
            <div className="mb-5 text-center">
              <p className="text-[14px] font-semibold text-[#292929]">
                {accessMode === 'Student' ? 'Student login' : 'Staff login'}
              </p>
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
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  {...register('identifier')}
                  className={`w-full rounded-[16px] border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#33b35a] focus:ring-4 focus:ring-[#33b35a]/10 ${
                    errors.identifier ? 'border-red-500' : 'border-[#d6ddd8]'
                  }`}
                  placeholder={accessMode === 'Student' ? 'Email or registration number' : 'Email or staff ID'}
                />
                {errors.identifier && (
                  <p className="mt-1.5 flex items-center text-xs text-red-500">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full rounded-[16px] border bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#33b35a] focus:ring-4 focus:ring-[#33b35a]/10 ${
                    errors.password ? 'border-red-500' : 'border-[#d6ddd8]'
                  }`}
                  placeholder="Password"
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] transition hover:text-[#393836]"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#33b35a] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#2d9a4e] hover:shadow-[0_16px_30px_rgba(51,179,90,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
