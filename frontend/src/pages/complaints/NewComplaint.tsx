import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Info,
  Loader2,
  Paperclip,
  Send,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] as const;

const COMPLAINT_CHANNELS = [
  'Portal Submission',
  'In Person',
  'Email',
  'Phone Call',
  'Referral from Lecturer',
  'Referral from HOD',
] as const;

const complaintSchema = z.object({
  // Identity
  studentName: z.string().min(1, 'Name is required'),
  regNo: z.string().min(1, 'Registration number is required'),
  college: z.string().min(1, 'College/School is required'),
  yearSemester: z.string().min(1, 'Current Year/Semester is required'),
  contact: z.string().min(1, 'Contact number is required'),

  // Complaint core
  categories: z.array(z.number()).min(1, 'Select at least one complaint category'),
  complaintChannel: z.enum(COMPLAINT_CHANNELS),
  title: z.string().min(8, 'Subject must be at least 8 characters').max(200, 'Under 200 characters'),
  description: z.string().min(20, 'Provide a clear description of your issue').max(5000),

  // Dynamic Academic Fields
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  acadYear: z.string().optional(),
  acadSemester: z.string().optional(),
  cwFeMention: z.string().optional(),
  lecturerName: z.string().optional(),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;
type Category = { id: number; name: string; description: string };

function getFileExtension(filename: string) {
  const parts = filename.split('.');
  return parts.length < 2 ? '' : parts[parts.length - 1].toLowerCase();
}

export default function NewComplaint() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  // Dropdown states
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      studentName: user ? `${user.first_name} ${user.last_name}` : '',
      categories: [],
      complaintChannel: 'Portal Submission',
      title: '',
      description: '',
      regNo: '', college: '', yearSemester: '', contact: '',
      courseCode: '', courseName: '', acadYear: '', acadSemester: '', cwFeMention: '', lecturerName: ''
    },
  });

  const selectedCategoryIds = watch('categories');
  const selectedCategories = categories.filter(c => selectedCategoryIds.includes(c.id));
  
  // Is this an academic / marks related complaint?
  const isAcademic = selectedCategories.some(c => 
    c.name.toLowerCase().includes('academic') || 
    c.name.toLowerCase().includes('marks') || 
    c.name.toLowerCase().includes('exam')
  );

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const catRes = await api.get('/complaints/categories');
        setCategories(catRes.data.data || []);
        
        // Load department ID if student
        const deptRes = await api.get('/appointments/departments');
        const depts = deptRes.data.data;
        if (depts && depts.length > 0) {
          setDepartmentId(depts[0].department_id); // The student's locked department
          setValue('regNo', depts[0].student_number || '');
          setValue('college', depts[0].faculty_name || '');
        }
      } catch (err: any) {
        toast.showError(err.response?.data?.message || 'Failed to initialize form');
      }
    };
    fetchMeta();
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    
    if (files.length + selected.length > MAX_FILES) {
      toast.showError(`You can only attach up to ${MAX_FILES} files.`);
      return;
    }

    const validFiles = selected.filter((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.showError(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB.`);
        return false;
      }
      const ext = getFileExtension(file.name) as any;
      if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        toast.showError(`${file.name} has an unsupported format.`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (id: number) => {
    const current = [...selectedCategoryIds];
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setValue('categories', current, { shouldValidate: true });
  };

  const buildFinalDescription = (data: ComplaintFormData) => {
    const catNames = categories.filter(c => data.categories.includes(c.id)).map(c => c.name).join(', ');
    
    let md = `**Categories:** ${catNames}\n`;
    md += `**Student Info:** ${data.studentName} (${data.regNo}) | ${data.college} | ${data.yearSemester} | Tel: ${data.contact}\n\n`;
    
    if (isAcademic) {
      md += `### Incomplete Results Details\n`;
      md += `- **Course:** ${data.courseCode} - ${data.courseName}\n`;
      md += `- **Period:** Year ${data.acadYear}, Sem ${data.acadSemester}\n`;
      md += `- **Mention (CW/FE):** ${data.cwFeMention}\n`;
      md += `- **Lecturer Name:** ${data.lecturerName}\n\n`;
    }

    md += `### Complaint Details\n${data.description}`;
    return md;
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    try {
      if (!departmentId) {
        throw new Error('Your account is missing a department assignment. Please contact admin.');
      }

      const formData = new FormData();
      formData.append('title', data.title);
      // Construct rich text description
      formData.append('description', buildFinalDescription(data));
      // Submit using the primary category selected (the first one)
      formData.append('categoryId', data.categories[0].toString());
      formData.append('departmentId', departmentId.toString());
      formData.append('complaintChannel', data.complaintChannel);

      files.forEach((file) => formData.append('attachments', file));

      const response = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmittedRef(response.data.data.reference_number);
      setSuccess(true);
      toast.showSuccess('Complaint submitted successfully');
    } catch (err: any) {
      toast.showError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900">Complaint Submitted Successfully!</h2>
        <p className="mt-2 text-slate-500">
          Your reference string is <span className="font-bold text-emerald-600">{submittedRef}</span>.
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Your complaint has been forwarded to your Head of Department. You will receive progress updates.
        </p>
        <button
          onClick={() => navigate('/dashboard/student/complaints', { replace: true })}
          className="mt-8 rounded-[16px] bg-[#34b05a] px-8 py-3 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:bg-[#2d9a4e] transition"
        >
          View My Complaints
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1c1c1e]">New Complaint</h1>
        <p className="mt-2 text-sm text-slate-500">Submit an official complaint or query to your department.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* STUDENT INFO SECTION */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <User className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">Student Identity</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name of Student</label>
              <input type="text" {...register('studentName')} className="w-full rounded-[14px] border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.studentName && <p className="text-xs text-rose-500">{errors.studentName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reg. No.</label>
              <input type="text" {...register('regNo')} className="w-full rounded-[14px] border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.regNo && <p className="text-xs text-rose-500">{errors.regNo.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">College/School, Program</label>
              <input type="text" {...register('college')} className="w-full rounded-[14px] border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.college && <p className="text-xs text-rose-500">{errors.college.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Year, Semester</label>
              <input type="text" placeholder="e.g. Year 2, Sem 1" {...register('yearSemester')} className="w-full rounded-[14px] border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.yearSemester && <p className="text-xs text-rose-500">{errors.yearSemester.message}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tel. Contact</label>
              <input type="text" {...register('contact')} className="w-full rounded-[14px] border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.contact && <p className="text-xs text-rose-500">{errors.contact.message}</p>}
            </div>
          </div>
        </div>

        {/* CORE COMPLAINT */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <FileText className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">Complaint Details</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Custom Multi-select Dropdown */}
              <div className="space-y-1" ref={categoryRef}>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Complaint Categories</label>
                <div 
                  className="relative w-full cursor-pointer rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus-within:border-[#34b05a] focus-within:ring-1 focus-within:ring-[#34b05a]"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-slate-700">
                      {selectedCategories.length === 0 ? 'Select categories...' : selectedCategories.map(c => c.name).join(', ')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                  
                  {isCategoryOpen && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-[16px] border border-slate-100 bg-white p-2 shadow-xl" onClick={e => e.stopPropagation()}>
                      {categories.map(c => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-[8px] p-2 hover:bg-slate-50 transition">
                          <input 
                            type="checkbox" 
                            checked={selectedCategoryIds.includes(c.id)}
                            onChange={() => toggleCategory(c.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#34b05a] focus:ring-[#34b05a]"
                          />
                          <span className="text-sm text-slate-700">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {errors.categories && <p className="text-xs text-rose-500">{errors.categories.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Complaint Channel</label>
                <select {...register('complaintChannel')} className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]">
                  {COMPLAINT_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject / Title</label>
              <input type="text" placeholder="Brief subject of the complaint" {...register('title')} className="w-full rounded-[14px] border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detailed Description</label>
              <textarea rows={5} placeholder="Explain the issue clearly..." {...register('description')} className="w-full resize-y rounded-[14px] border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
              {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* DYNAMIC INCOMPLETE RESULTS / ACADEMIC SECTION */}
        {isAcademic && (
          <div className="rounded-[24px] border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-500/5 blur-3xl" />
            <div className="mb-6 flex items-center gap-2 border-b border-blue-100/50 pb-4 relative z-10">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-900">Incomplete Results Specifics</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 relative z-10">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Course Code</label>
                <input type="text" {...register('courseCode')} className="w-full rounded-[14px] border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Course Name</label>
                <input type="text" {...register('courseName')} className="w-full rounded-[14px] border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Year</label>
                <input type="text" {...register('acadYear')} className="w-full rounded-[14px] border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Semester</label>
                <input type="text" {...register('acadSemester')} className="w-full rounded-[14px] border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mention CW / FE</label>
                <select {...register('cwFeMention')} className="w-full rounded-[14px] border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Select option...</option>
                  <option value="Coursework (CW)">Coursework (CW) Missing</option>
                  <option value="Final Exam (FE)">Final Exam (FE) Missing</option>
                  <option value="Both (CW & FE)">Both (CW & FE) Missing</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lecturer Name</label>
                <input type="text" {...register('lecturerName')} className="w-full rounded-[14px] border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* ATTACHMENTS */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Paperclip className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">Attachments (Optional)</h2>
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition hover:border-[#34b05a] hover:bg-emerald-50/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition">
              <UploadCloud className="h-5 w-5 text-[#34b05a]" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-slate-400">PDF, Word, JPG, PNG — up to 10MB each</p>
            <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, i) => (
                <li key={i} className="flex items-center justify-between rounded-[12px] border border-slate-100 bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center gap-3 truncate">
                    <FileText className="h-4 w-4 shrink-0 text-[#34b05a]" />
                    <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
                    <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-[16px] bg-[#34b05a] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#34b05a]/20 transition-all hover:-translate-y-0.5 hover:bg-[#2d9a4e] hover:shadow-xl hover:shadow-[#34b05a]/30 disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>

      </form>
    </div>
  );
}
