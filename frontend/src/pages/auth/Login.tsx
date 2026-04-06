import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or registration number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setApiError('');
    try {
      const res = await api.post('/auth/login', data);
      if (res.data.status === 'success') {
        login(res.data.token, res.data.user);
        navigate('/dashboard/student');
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-gray-900"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-[#35393c]/50" />

      <div className="relative z-10 w-full max-w-[420px] mx-4 pt-12">
        {/* Card */}
        <div className="bg-white">
          {/* No green top bar replicating the native portal */}

          <div className="px-10 py-10">
            {/* Logo area replicating the native Student Portal */}
            <div className="flex flex-col items-center mb-8 font-['Arial',sans-serif]">
              <div className="flex items-center text-[#2ea84b] mb-2">
                <div className="flex flex-col items-center">
                  {/* Simplistic fallback for the Giraffe KIU logo */}
                  <span className="font-extrabold text-[42px] tracking-tighter leading-none" style={{ transform: 'scaleY(1.1)' }}>KIU</span>
                  <span className="text-[6.5px] font-bold tracking-widest mt-0.5 whitespace-nowrap">EXPLORING THE HEIGHTS</span>
                </div>
                <div className="ml-3 flex flex-col justify-center font-bold text-[10px] leading-[1.2] tracking-wider text-[#2ea84b] whitespace-nowrap">
                  <span>KAMPALA</span>
                  <span>INTERNATIONAL</span>
                  <span>UNIVERSITY</span>
                </div>
              </div>
              <h1 className="text-[22px] font-bold text-gray-900 mt-5">Student Portal</h1>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="mb-5 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Identifier */}
              <div>
                <input
                  type="text"
                  autoComplete="username"
                  {...register('identifier')}
                  className={`w-full px-4 py-3 border text-[13px] text-gray-700 outline-none focus:border-[#2ea84b] transition-colors ${
                    errors.identifier ? 'border-red-500' : 'border-[#d0d0d0]'
                  }`}
                  placeholder="Email or Registration number"
                />
                {errors.identifier && (
                  <p className="mt-1 flex items-center text-xs text-red-500"><AlertCircle className="h-3 w-3 mr-1"/>{errors.identifier.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full px-4 py-3 border text-[13px] text-gray-700 outline-none focus:border-[#2ea84b] transition-colors pr-10 ${
                      errors.password ? 'border-red-500' : 'border-[#d0d0d0]'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 flex items-center text-xs text-red-500"><AlertCircle className="h-3 w-3 mr-1"/>{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#2ea84b] hover:bg-[#258a3d] disabled:opacity-70 text-white text-[15px] rounded-sm transition-colors mt-2"
              >
                {isSubmitting ? 'Signing in...' : 'Next'}
              </button>
            </form>

            {/* Bottom text info recreating the student portal footer */}
            <div className="mt-8 text-[11px] leading-tight text-[#666] font-['Arial',sans-serif] px-1">
              Please use your registration number or KIU student email address (e.g. xxxxxx@stdwc.kiu.ac.ug) to login. For assistance please visit ICT office.
              <div className="mt-4 flex justify-between">
                <Link to="/forgot-password" className="text-[#2ea84b] hover:underline">Forgot password?</Link>
                <Link to="/register" className="text-[#2ea84b] hover:underline">Register for SCMS</Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
