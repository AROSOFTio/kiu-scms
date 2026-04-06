import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileText,
  X, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Send,
  Plus,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import api from '../../lib/api';

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  categoryId: z.string().min(1, 'Please select a category'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

export default function NewComplaint() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      priority: 'Medium'
    }
  });

  const descriptionValue = watch('description') || '';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/complaints/categories');
        setCategories(res.data.data);
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        setError('Maximum 5 files allowed');
        return;
      }
      setFiles([...files, ...newFiles]);
      setError('');
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('categoryId', data.categoryId);
      formData.append('priority', data.priority);
      formData.append('description', data.description);
      
      files.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard/student/complaints'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in zoom-in duration-700">
        <div className="relative group mb-10">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000" />
          <div className="relative bg-white p-8 rounded-full shadow-2xl shadow-emerald-900/10 border border-emerald-50">
            <CheckCircle2 className="h-16 w-16 text-[#008540] animate-in slide-in-from-bottom-2" />
          </div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter italic">Submission Successful.</h2>
        <p className="text-slate-500 mb-10 text-center max-w-md font-medium px-4 leading-relaxed">
          Your grievance has been successfully logged within the KIU Institutional framework. A staff member will be assigned shortly.
        </p>
        <button 
           onClick={() => navigate('/dashboard/student/complaints')}
           className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all active:scale-95 flex items-center gap-3"
        >
          <ArrowRight className="h-4 w-4" />
          Enter Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-4 transition-all"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Return to Safety
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Log Institutional <span className="text-emerald-600">Grievance</span></h1>
            <p className="text-slate-500 mt-2 font-medium italic">Empowering student voices through structured resolution.</p>
        </div>
        <div className="hidden lg:block">
           <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Auditable Entry</span>
           </div>
        </div>
      </div>

      <div className="premium-card relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400" />
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-10 lg:p-14 space-y-10">
          {error && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 animate-shake">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assessment Category</label>
              <select
                {...register('categoryId')}
                className={`premium-input py-5 ${errors.categoryId ? 'border-red-300 ring-4 ring-red-50' : ''}`}
              >
                <option value="">-- Classified Type --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-[10px] font-black uppercase tracking-tight ml-2">{errors.categoryId.message}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Grievance Severity</label>
              <select
                {...register('priority')}
                className="premium-input py-5"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Assessment</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Concise Subject</label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g., Discrepancy in Semester Exam Grading Hub"
              className={`premium-input py-5 ${errors.title ? 'border-red-300 ring-4 ring-red-50' : ''}`}
            />
            {errors.title && <p className="text-red-500 text-[10px] font-black uppercase tracking-tight ml-2">{errors.title.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Exposition</label>
              <span className={`text-[9px] font-black uppercase tracking-widest ${descriptionValue.length < 20 ? 'text-red-400' : 'text-emerald-500'}`}>
                Intensity: {descriptionValue.length} / {descriptionValue.length < 20 ? 'Min 20' : 'Optimal'}
              </span>
            </div>
            <textarea
              {...register('description')}
              rows={8}
              placeholder="Provide a comprehensive narrative of the grievance, including specific environmental context, temporal data, and any participating entities."
              className={`premium-input py-6 resize-none leading-relaxed ${errors.description ? 'border-red-300 ring-4 ring-red-50' : ''}`}
            />
            {errors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-tight ml-2">{errors.description.message}</p>}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Supporting Evidence (Maximum 5)</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <label className="flex flex-col items-center justify-center w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 transition-all active:scale-[0.98]">
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-emerald-600 transition-all">
                       <Plus className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Inject Attachments</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                  <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group animate-in slide-in-from-right-2">
                      <div className="flex items-center overflow-hidden gap-3">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[140px] uppercase tracking-tighter">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(index)} className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl shadow-sm transition-all active:scale-90">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
            >
              Abandon Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-12 py-5 bg-[#008540] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-900/20 hover:translate-y-[-2px] hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Encrypting & Sending...
                </>
              ) : (
                <>
                   Initialize Case
                   <Send className="h-4 w-4 rotate-12" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper icons missing from previous step
const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);
