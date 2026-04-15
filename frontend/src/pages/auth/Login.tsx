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
  FileStack,
  GraduationCap,
  ShieldCheck,
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
  detail: string;
  icon: typeof GraduationCap;
}> = [
  {
    value: 'Student',
    label: 'Student',
    detail: 'Submit and track complaints',
    icon: GraduationCap,
  },
  {
    value: 'Staff',
    label: 'Staff / HOD',
    detail: 'Review, route, and update cases',
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
    <div className="min-h-screen bg-[#eef2f6]">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(22,163,74,0.08),_transparent_32%)]" />
        <div className="absolute inset-y-0 left-0 hidden w-1/2 border-r border-white/40 bg-white/30 lg:block" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10 sm:px-8">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_420px] lg:gap-14">
            <section className="flex flex-col justify-center">
              <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-600 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                KIU Student Complaint System
              </div>

              <div className="max-w-xl">
                <img src="/kiu-logo.png" alt="Kampala International University" className="mb-6 h-14 w-auto object-contain mix-blend-multiply" />
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Complaint management for students, staff, and HOD offices.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Submit concerns, route cases, track action, and close complaints through one structured KIU workflow.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Submit</p>
                  <p className="mt-2 text-sm text-slate-700">Formal complaints with clear issue categories and attachments.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review</p>
                  <p className="mt-2 text-sm text-slate-700">HOD and responsible offices review, route, and update status.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Track</p>
                  <p className="mt-2 text-sm text-slate-700">Students follow progress from submission through resolution.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">Submitted</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">Under Review</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">In Progress</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">Resolved</span>
              </div>
            </section>

            <section className="w-full">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h2>
                  <p className="mt-2 text-sm text-slate-600">Use your assigned KIU account credentials.</p>
                </div>

                {apiError && (
                  <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  {accessOptions.map(({ value, label, detail, icon: Icon }) => {
                    const isActive = accessMode === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue('accessMode', value, { shouldValidate: true })}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className={`text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{detail}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <input type="hidden" {...register('accessMode')} />

                  <div>
                    <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-700">
                      {accessMode === 'Student' ? 'Registration number or KIU email' : 'Staff ID or institutional email'}
                    </label>
                    <input
                      id="identifier"
                      type="text"
                      autoComplete="username"
                      {...register('identifier')}
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 ${
                        errors.identifier ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder={accessMode === 'Student' ? 'e.g. BSC/01/1234 or name@stud.kiu.ac.ug' : 'e.g. ST-2048 or name@kiu.ac.ug'}
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
                        className={`w-full rounded-2xl border bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 ${
                          errors.password ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Enter your password"
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <FileStack className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                    <p>
                      Student access is validated against student records. Staff and HOD access is determined automatically from the account assigned in the system.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
