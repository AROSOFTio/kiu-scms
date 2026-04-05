import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  studentNumber: z.string().min(4, 'Student number must be at least 4 characters'),
  departmentId: z.string().min(1, 'Please select your department'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Department {
  id: number;
  name: string;
  faculty_name: string;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    api.get('/admin/departments').then(res => {
      if (res.data.data) setDepartments(res.data.data);
    }).catch(() => {
      // Silently fail — departments will be empty
    });
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    setApiError('');
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        studentNumber: data.studentNumber,
        departmentId: data.departmentId,
        password: data.password,
      };
      const res = await api.post('/auth/register/student', payload);
      if (res.data.status === 'success') {
        login(res.data.token, res.data.user);
        navigate('/dashboard/student');
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative py-8"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-[520px] mx-4">
        <div className="bg-white shadow-2xl">
          <div className="h-1.5 bg-[#008540]" />

          <div className="px-10 py-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-7">
              <div className="flex items-end text-[#008540] mb-3">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 22H6V14H4V22ZM18 22H20V6H18V22ZM11 22H13V10H11V22Z"/>
                </svg>
                <div className="ml-1.5 font-extrabold leading-tight uppercase">
                  <div className="text-2xl tracking-tight">KIU</div>
                </div>
                <div className="ml-2 text-[9px] flex flex-col justify-end pb-0.5 font-semibold leading-tight text-[#008540]">
                  <span>KAMPALA</span>
                  <span>INTERNATIONAL</span>
                  <span>UNIVERSITY</span>
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Student Registration</h1>
              <p className="text-[11px] text-gray-500 font-semibold tracking-[0.15em] uppercase mt-0.5">
                Complaint Management System
              </p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors ${errors.firstName ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors ${errors.lastName ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="you@stdwc.kiu.ac.ug"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              {/* Student Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Student Registration Number</label>
                <input
                  type="text"
                  {...register('studentNumber')}
                  className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors ${errors.studentNumber ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="e.g. 2100700123"
                />
                {errors.studentNumber && <p className="mt-1 text-xs text-red-600">{errors.studentNumber.message}</p>}
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Department</label>
                <select
                  {...register('departmentId')}
                  className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors bg-white ${errors.departmentId ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">-- Select your department --</option>
                  {departments.length > 0 ? departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.faculty_name})
                    </option>
                  )) : (
                    <option value="1">Computer Science (Faculty of Computing)</option>
                  )}
                </select>
                {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors pr-10 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`w-full px-3.5 py-2.5 border text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#008540]/30 focus:border-[#008540] transition-colors pr-10 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Re-enter your password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#008540] hover:bg-[#006830] disabled:bg-gray-400 text-white text-sm font-semibold rounded-sm transition-colors mt-2 tracking-wide uppercase"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-gray-100 pt-5">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#008540] font-semibold hover:underline">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
        <p className="text-center text-white/50 text-xs mt-5">
          © {new Date().getFullYear()} Kampala International University. All rights reserved.
        </p>
      </div>
    </div>
  );
}
