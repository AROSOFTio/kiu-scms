import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  BookOpen, Check, ChevronDown, FileText, Loader2,
  Paperclip, Send, UploadCloud, User, X,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] as const;

const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
const SEMESTER_OPTIONS = ['Semester 1', 'Semester 2', 'Semester 3'];
const COLLEGE_OPTIONS = ['SOL', 'CEM', 'CHSS', 'SONAS'];
const CW_FE_OPTIONS = [
  { value: 'Coursework', label: 'Coursework' },
  { value: 'Final Exam', label: 'Final Exam' },
  { value: 'Both',       label: 'Both' },
];

const complaintSchema = z.object({
  studentName:     z.string().min(1, 'Name is required'),
  regNo:           z.string().min(1, 'Registration number is required'),
  college:         z.string().min(1, 'College/School is required'),
  currentYear:     z.string().min(1, 'Current year is required'),
  currentSemester: z.string().min(1, 'Current semester is required'),
  departmentId:     z.string().min(1, 'Department is required'),
  contact:         z.string().min(1, 'Contact number is required'),
  categories:      z.array(z.number()).min(1, 'Select at least one category'),
  title:           z.string().min(8, 'Subject must be at least 8 characters').max(200),
  // Academic fields (optional unless academic category selected)
  courseCode:   z.string().optional(),
  courseName:   z.string().optional(),
  acadYear:     z.string().optional(),
  acadSemester: z.string().optional(),
  cwFeMention:  z.string().optional(),
  lecturerName: z.string().optional(),
  // Description always required
  description:  z.string().min(20, 'Provide a clear description (min 20 characters)').max(5000),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;
type Category = { id: number; name: string; description: string };
type Department = { id: number; name: string; faculty_name?: string; student_number?: string };

function getFileExt(filename: string) {
  const p = filename.split('.');
  return p.length < 2 ? '' : p[p.length - 1].toLowerCase();
}

export default function NewComplaint() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [profileLinked, setProfileLinked] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      studentName: user ? `${user.firstName} ${user.lastName}` : '',
      categories: [], title: '', description: '',
      regNo: '', college: '', currentYear: '', currentSemester: '', contact: '',
      departmentId: '',
      courseCode: '', courseName: '', acadYear: '', acadSemester: '',
      cwFeMention: '', lecturerName: '',
    },
  });

  const selectedCategoryIds = watch('categories');
  const selectedCategories = categories.filter(c => selectedCategoryIds.includes(c.id));
  const isAcademic = selectedCategories.some(c =>
    c.name.toLowerCase().includes('academic') ||
    c.name.toLowerCase().includes('marks') ||
    c.name.toLowerCase().includes('exam') ||
    c.name.toLowerCase().includes('result')
  );

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node))
        setIsCategoryOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Reset academic fields when category changes away from academic
  useEffect(() => {
    if (!isAcademic) {
      setValue('courseCode', '');
      setValue('courseName', '');
      setValue('acadYear', '');
      setValue('acadSemester', '');
      setValue('cwFeMention', '');
      setValue('lecturerName', '');
    }
  }, [isAcademic, setValue]);

  // Load categories + student profile
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, deptRes] = await Promise.all([
          api.get('/complaints/categories'),
          api.get('/appointments/departments'),
        ]);

        setCategories(catRes.data.data || []);

        // Backend returns { data: { departments: [...], defaultDepartmentId, profileLinked, ... } }
        const deptData = deptRes.data.data;
        if (deptData) {
          setProfileLinked(!!deptData.profileLinked);
          const depts: Department[] = (deptData.departments || []).slice(0, 2);
          setDepartments(depts);

          if (deptData.defaultDepartmentId) {
            setDepartmentId(deptData.defaultDepartmentId);
            setValue('departmentId', String(deptData.defaultDepartmentId));
          }

          // Pre-fill reg no from first department entry if available
          if (depts.length > 0) {
            if (depts[0].student_number) setValue('regNo', depts[0].student_number);
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load form data. Please refresh.');
      }
    };
    load();
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed.`); return;
    }
    const valid = selected.filter(f => {
      if (f.size > MAX_FILE_SIZE_BYTES) { toast.error(`${f.name} exceeds ${MAX_FILE_SIZE_MB}MB.`); return false; }
      if (!ALLOWED_EXTENSIONS.includes(getFileExt(f.name) as any)) { toast.error(`${f.name} has unsupported format.`); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...valid]);
  };

  const toggleCategory = (id: number) => {
    const cur = [...selectedCategoryIds];
    const idx = cur.indexOf(id);
    if (idx > -1) cur.splice(idx, 1); else cur.push(id);
    setValue('categories', cur, { shouldValidate: true });
  };

  /** Build clean plain-text description (no markdown) */
  const buildDescription = (data: ComplaintFormData): string => {
    const catNames = categories.filter(c => data.categories.includes(c.id)).map(c => c.name).join(', ');
    const lines: string[] = [];
    lines.push(`Categories: ${catNames}`);
    lines.push(`Student: ${data.studentName} | Reg No: ${data.regNo} | ${data.college} | ${data.currentYear}, ${data.currentSemester} | Tel: ${data.contact}`);
    lines.push(`Department: ${departments.find((department) => String(department.id) === data.departmentId)?.name || 'N/A'}`);
    if (isAcademic) {
      lines.push('');
      lines.push('Result / Academic Complaint Details:');
      lines.push(`Course: ${data.courseCode || 'N/A'} - ${data.courseName || 'N/A'}`);
      lines.push(`Period: ${data.acadYear || 'N/A'}, ${data.acadSemester || 'N/A'}`);
      lines.push(`Assessment type: ${data.cwFeMention || 'N/A'}`);
      lines.push(`Lecturer: ${data.lecturerName || 'N/A'}`);
    }
    lines.push('');
    lines.push('Complaint Details:');
    lines.push(data.description);
    return lines.join('\n');
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    try {
      if (!departmentId) {
        toast.error(
          profileLinked
            ? 'Your department could not be resolved. Please contact the administrator.'
            : 'Your student profile is not linked to a department. Please contact the administrator.'
        );
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', buildDescription(data));
      formData.append('categoryId', data.categories[0].toString());
      formData.append('departmentId', departmentId.toString());
      // complaintChannel intentionally omitted — backend defaults to 'Portal Submission'

      files.forEach(f => formData.append('attachments', f));

      const response = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Backend returns: { data: { id, reference } }
      const ref: string = response.data.data?.reference || response.data.data?.reference_number || '';
      setSubmittedRef(ref);
      setSuccess(true);
      toast.success('Complaint submitted successfully');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else {
        toast.error('Failed to submit complaint. Please try again.');
      }
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
          Your reference number is{' '}
          <span className="font-bold text-emerald-600">{submittedRef || 'N/A'}</span>.
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

  const inputCls = 'w-full rounded-[14px] border border-slate-200 bg-slate-50 px-5 py-3.5 text-base font-medium outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]';
  const selectCls = `${inputCls} appearance-none`;
  const errCls = 'text-sm font-medium text-rose-500 mt-1';
  const departmentInput = register('departmentId');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1c1c1e]">New Complaint</h1>
        <p className="mt-3 text-base text-slate-600">Submit an official complaint or query to your department.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* STUDENT IDENTITY */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <User className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-base font-extrabold uppercase tracking-widest text-[#1c1c1e]">Student Identity</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700">Name of Student</label>
              <input type="text" {...register('studentName')} className={inputCls} />
              {errors.studentName && <p className={errCls}>{errors.studentName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700">Reg. No.</label>
              <input type="text" {...register('regNo')} className={inputCls} />
              {errors.regNo && <p className={errCls}>{errors.regNo.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-bold tracking-wide text-slate-700">College / School</label>
              <select {...register('college')} className={selectCls}>
                <option value="">Select college / school</option>
                {COLLEGE_OPTIONS.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
              {errors.college && <p className={errCls}>{errors.college.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-bold tracking-wide text-slate-700">Department</label>
              <select
                {...departmentInput}
                className={selectCls}
                onChange={(event) => {
                  departmentInput.onChange(event);
                  setDepartmentId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className={errCls}>{errors.departmentId.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700">Current Year</label>
              <select {...register('currentYear')} className={selectCls}>
                <option value="">Select year...</option>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.currentYear && <p className={errCls}>{errors.currentYear.message}</p>}
            </div>
            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700">Current Semester</label>
              <select {...register('currentSemester')} className={selectCls}>
                <option value="">Select semester...</option>
                {SEMESTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.currentSemester && <p className={errCls}>{errors.currentSemester.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-bold tracking-wide text-slate-700">Tel. Contact</label>
              <input type="text" {...register('contact')} className={inputCls} />
              {errors.contact && <p className={errCls}>{errors.contact.message}</p>}
            </div>
          </div>
        </div>

        {/* COMPLAINT DETAILS */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <FileText className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-base font-extrabold uppercase tracking-widest text-[#1c1c1e]">Complaint Details</h2>
          </div>

          <div className="space-y-5">
            {/* Category multi-select */}
            <div ref={categoryRef}>
              <label className="text-sm font-bold tracking-wide text-slate-700">Complaint Category</label>
              <div
                className="relative mt-1 cursor-pointer rounded-[14px] border border-slate-200 bg-slate-50 px-5 py-3.5 text-base font-medium focus-within:border-[#34b05a] focus-within:ring-1 focus-within:ring-[#34b05a]"
                onClick={() => setIsCategoryOpen(v => !v)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-slate-700">
                    {selectedCategories.length === 0 ? 'Select categories...' : selectedCategories.map(c => c.name).join(', ')}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                {isCategoryOpen && (
                  <div className="absolute left-0 top-full z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-[16px] border border-slate-100 bg-white p-2 shadow-xl" onClick={e => e.stopPropagation()}>
                    {categories.map(c => (
                      <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-[8px] p-2 hover:bg-slate-50 transition">
                        <input type="checkbox" checked={selectedCategoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} className="h-4 w-4 rounded border-slate-300 text-[#34b05a] focus:ring-[#34b05a]" />
                        <span className="text-sm text-slate-700">{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.categories && <p className={errCls}>{errors.categories.message}</p>}
            </div>

            <div>
              <label className="text-sm font-bold tracking-wide text-slate-700">Subject / Title</label>
              <input type="text" placeholder="Brief subject of the complaint" {...register('title')} className={inputCls} />
              {errors.title && <p className={errCls}>{errors.title.message}</p>}
            </div>
          </div>
        </div>

        {/* ACADEMIC / INCOMPLETE RESULTS — shown before description */}
        {isAcademic && (
          <div className="rounded-[24px] border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-blue-100/50 pb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-extrabold uppercase tracking-widest text-blue-900">Result / Academic Complaint Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold tracking-wide text-slate-700">Course Code</label>
                <input type="text" {...register('courseCode')} className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-bold tracking-wide text-slate-700">Course Name</label>
                <input type="text" {...register('courseName')} className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-bold tracking-wide text-slate-700">Year</label>
                <select {...register('acadYear')} className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                  <option value="">Select year...</option>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold tracking-wide text-slate-700">Semester</label>
                <select {...register('acadSemester')} className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                  <option value="">Select semester...</option>
                  {SEMESTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold tracking-wide text-slate-700">Assessment Type</label>
                <select {...register('cwFeMention')} className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                  <option value="">Select option...</option>
                  {CW_FE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold tracking-wide text-slate-700">Lecturer Name</label>
                <input type="text" {...register('lecturerName')} className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* DETAILED DESCRIPTION — always last, after academic fields */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
            <FileText className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-base font-extrabold uppercase tracking-widest text-[#1c1c1e]">Detailed Description</h2>
          </div>
          <textarea rows={6} placeholder="Explain the issue clearly..." {...register('description')} className="w-full resize-y rounded-[14px] border border-slate-200 bg-slate-50 p-5 text-base font-medium outline-none focus:border-[#34b05a] focus:ring-1 focus:ring-[#34b05a]" />
          {errors.description && <p className={errCls}>{errors.description.message}</p>}
        </div>

        {/* ATTACHMENTS */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Paperclip className="h-5 w-5 text-[#34b05a]" />
            <h2 className="text-base font-extrabold uppercase tracking-widest text-[#1c1c1e]">Attachments (Optional)</h2>
          </div>
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition hover:border-[#34b05a] hover:bg-emerald-50/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition">
              <UploadCloud className="h-5 w-5 text-[#34b05a]" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-slate-400">PDF, Word, JPG, PNG — up to 10 MB each</p>
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
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
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
            className="flex items-center gap-2 rounded-[16px] bg-[#34b05a] px-10 py-4 text-base font-bold text-white shadow-lg shadow-[#34b05a]/20 transition-all hover:-translate-y-0.5 hover:bg-[#2d9a4e] hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}
