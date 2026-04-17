import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Info,
  Loader2,
  Paperclip,
  Send,
  UploadCloud,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] as const;

const issueTypes = [
  'Marks / Results',
  'Tuition / Finance',
  'Exams',
  'Lecturer / Staff Conduct',
  'Registration',
  'ICT / Portal',
  'Welfare / Hostel',
  'Other',
] as const;

const COMPLAINT_CHANNELS = [
  'Portal Submission',
  'In Person',
  'Email',
  'Phone Call',
  'Referral from Lecturer',
  'Referral from HOD',
] as const;

const complaintSchema = z.object({
  issueTypes: z.array(z.enum(issueTypes)).min(1, 'Select at least one complaint type'),
  complaintChannel: z.enum(COMPLAINT_CHANNELS),
  relatedStaff: z.string().trim().max(120, 'Keep under 120 characters').optional(),
  title: z.string().trim().min(8, 'Subject must be at least 8 characters').max(200, 'Under 200 characters'),
  description: z
    .string()
    .trim()
    .min(60, 'Provide a detailed description with at least 60 characters')
    .max(5000, 'Description is too long'),
  incidentDate: z.string().min(1, 'Select the date of incident'),
  desiredResolution: z
    .string()
    .trim()
    .min(20, 'Describe the desired resolution with at least 20 characters')
    .max(800, 'Too long'),
  declaration: z.boolean().refine((v) => v === true, 'You must confirm the declaration'),
}).superRefine((data, ctx) => {
  if (data.issueTypes.includes('Lecturer / Staff Conduct') && !data.relatedStaff?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['relatedStaff'],
      message: 'Provide the name of the lecturer or staff member involved',
    });
  }
  if (data.incidentDate) {
    const incident = new Date(`${data.incidentDate}T00:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (incident > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['incidentDate'],
        message: 'Date of incident cannot be in the future',
      });
    }
  }
});

type ComplaintFormData = z.infer<typeof complaintSchema>;
type Category = { id: number; name: string };

function getFileExtension(filename: string) {
  const parts = filename.split('.');
  return parts.length < 2 ? '' : parts[parts.length - 1].toLowerCase();
}

function getCategoryNameFromIssueType(issueType: (typeof issueTypes)[number]) {
  if (issueType === 'Marks / Results' || issueType === 'Exams') return 'academic';
  if (issueType === 'Tuition / Finance') return 'financial';
  if (issueType === 'ICT / Portal') return 'technical';
  if (issueType === 'Welfare / Hostel') return 'hostel';
  if (issueType === 'Lecturer / Staff Conduct' || issueType === 'Registration') return 'administration';
  return 'other';
}

function mapIssueTypesToCategoryId(selected: ComplaintFormData['issueTypes'], categories: Category[]) {
  const normalized = categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.name.toLowerCase()] = c.id;
    return acc;
  }, {});
  const names = Array.from(new Set(selected.map(getCategoryNameFromIssueType)));
  const name = names.length === 1 ? names[0] : 'other';
  return normalized[name] || normalized.other || null;
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-b border-slate-200 pb-8 last:border-b-0 last:pb-0">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#292929]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

// Complaint Channeling Procedure info card
function ChannelingProcedureCard() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#c8e6d4] bg-gradient-to-br from-[#f0faf4] to-[#e8f8ee]">
      <div className="flex gap-4 px-5 py-5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#34b05a]/15 text-[#34b05a]">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1c3a25]">KIU Complaint Channeling Procedure</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#2f5e3c]">
            Your complaint will be automatically forwarded to the Head of Department (HOD) of your registered department.
            The HOD will review your complaint, assign it to the appropriate lecturer or staff member, and ensure it is
            acted upon within the stipulated timeframe.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { step: '1', label: 'You submit', desc: 'Complaint is registered and sent to your HOD' },
              { step: '2', label: 'HOD reviews', desc: 'HOD assigns the complaint to the right lecturer' },
              { step: '3', label: 'Resolution', desc: 'Lecturer addresses and closes the complaint' },
            ].map((item) => (
              <div key={item.step} className="rounded-[14px] border border-[#bfe0cc] bg-white/60 px-3 py-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#34b05a] text-[11px] font-bold text-white">
                  {item.step}
                </span>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1c3a25]">{item.label}</p>
                <p className="mt-0.5 text-xs text-[#3a7a4e]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewComplaint() {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [studentDept, setStudentDept] = useState<{ departmentId: number; departmentName: string; facultyName: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      issueTypes: [],
      complaintChannel: 'Portal Submission',
      relatedStaff: '',
      title: '',
      description: '',
      incidentDate: '',
      desiredResolution: '',
      declaration: false,
    },
  });

  const selectedIssueTypes = watch('issueTypes') || [];
  const descriptionValue = watch('description') || '';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        // Load categories
        const catRes = await api.get('/complaints/categories');
        setCategories(catRes.data.data || []);

        // Load student's own department from their profile
        const deptRes = await api.get('/appointments/departments');
        const payload = deptRes.data.data || {};
        if (payload.profileLinked && payload.defaultDepartmentId && payload.departments?.length) {
          const dept = payload.departments[0];
          setStudentDept({
            departmentId: dept.id,
            departmentName: dept.name,
            facultyName: dept.faculty_name,
          });
        }
      } catch {
        toast.error('Failed to load form options');
      }
    };
    fetchMeta();
  }, [toast]);

  const toggleIssueType = (issueType: (typeof issueTypes)[number]) => {
    const next = selectedIssueTypes.includes(issueType)
      ? selectedIssueTypes.filter((i) => i !== issueType)
      : [...selectedIssueTypes, issueType];
    setValue('issueTypes', next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const rejected: string[] = [];
    setFiles((current) => {
      const next = [...current];
      for (const file of incoming) {
        if (next.length >= MAX_FILES) { rejected.push(`Maximum ${MAX_FILES} files allowed`); break; }
        if (file.size > MAX_FILE_SIZE_BYTES) { rejected.push(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB`); continue; }
        const ext = getFileExtension(file.name);
        if (!ALLOWED_FILE_EXTENSIONS.includes(ext as never)) { rejected.push(`${file.name} has an unsupported type`); continue; }
        if (next.some((f) => f.name === file.name && f.size === file.size)) { rejected.push(`${file.name} already attached`); continue; }
        next.push(file);
      }
      return next;
    });
    if (rejected.length > 0) toast.error(rejected[0]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ComplaintFormData) => {
    const categoryId = mapIssueTypesToCategoryId(data.issueTypes, categories);
    if (!categoryId) {
      toast.error('Complaint categories are not configured. Please contact your administrator.');
      return;
    }
    if (!studentDept) {
      toast.error('Your student profile is not linked to a department. Please contact your administrator.');
      return;
    }

    setIsSubmitting(true);
    try {
      const composedDescription = [
        `Issue Types: ${data.issueTypes.join(', ')}`,
        `Department: ${studentDept.departmentName}`,
        `Faculty: ${studentDept.facultyName}`,
        data.relatedStaff?.trim() ? `Related Lecturer/Staff: ${data.relatedStaff.trim()}` : '',
        `Date of Incident: ${data.incidentDate}`,
        '',
        '--- Complaint Details ---',
        data.description.trim(),
        '',
        '--- Desired Resolution ---',
        data.desiredResolution.trim(),
      ].filter((line, idx, arr) => !(line === '' && (idx === 0 || arr[idx - 1] === ''))).join('\n');

      const formData = new FormData();
      formData.append('title', data.title.trim());
      formData.append('categoryId', String(categoryId));
      formData.append('description', composedDescription);
      formData.append('departmentId', String(studentDept.departmentId));
      formData.append('complaintChannel', data.complaintChannel);
      files.forEach((file) => formData.append('attachments', file));

      const response = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmittedRef(response.data.data?.reference || '');
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-[24px] border border-[#c8e6d4] bg-gradient-to-br from-[#f0faf4] to-[#e8f8ee] px-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#34b05a]/15">
          <CheckCircle2 className="h-10 w-10 text-[#34b05a]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1c3a25]">Complaint Submitted</h2>
          <p className="mt-2 text-sm text-[#3a7a4e]">
            Your complaint has been received and forwarded to your departmental HOD for review.
          </p>
          {submittedRef && (
            <div className="mt-4 inline-block rounded-full bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#2f5e3c] shadow-sm">
              Reference: <span className="font-mono">{submittedRef}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/dashboard/student/complaints')}
            className="inline-flex items-center gap-2 rounded-[16px] bg-[#34b05a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2d9a4e]"
          >
            View My Complaints <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setSuccess(false); setFiles([]); }}
            className="inline-flex items-center gap-2 rounded-[16px] border border-[#bfe0cc] bg-white px-6 py-3 text-sm font-semibold text-[#2f5e3c] transition hover:bg-white/70"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h1 className="text-[22px] font-semibold text-[#1f2937]">Submit a Complaint</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete all sections below. Your complaint will be routed directly to your departmental HOD.
          </p>
        </div>
        {studentDept && (
          <div className="rounded-[16px] border border-[#dfe5eb] bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Your Department</p>
            <p className="mt-0.5 text-sm font-semibold text-[#1f2937]">{studentDept.departmentName}</p>
            <p className="text-xs text-slate-400">{studentDept.facultyName}</p>
          </div>
        )}
      </div>

      {/* Channeling procedure card */}
      <ChannelingProcedureCard />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-[24px] border border-[#dfe5eb] bg-white p-6 shadow-[0_24px_52px_-40px_rgba(31,41,55,0.22)] sm:p-8">

        {/* Section 1 — Complaint Channel */}
        <Section
          title="1. Complaint Channel"
          subtitle="How is this complaint being submitted? Select the method that applies."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COMPLAINT_CHANNELS.map((channel) => {
              const selected = watch('complaintChannel') === channel;
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setValue('complaintChannel', channel, { shouldValidate: true })}
                  className={`rounded-[16px] border px-4 py-3 text-left text-xs font-semibold transition ${
                    selected
                      ? 'border-[#34b05a] bg-[#34b05a]/8 text-[#34b05a] shadow-sm'
                      : 'border-[#dfe5eb] bg-[#f8fafb] text-slate-500 hover:border-[#34b05a]/40 hover:text-[#34b05a]'
                  }`}
                >
                  {selected && <CheckCircle2 className="mb-1 h-3.5 w-3.5 text-[#34b05a]" />}
                  {channel}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Section 2 — Nature of complaint */}
        <Section
          title="2. Nature of Complaint"
          subtitle="Select all issue types that apply to your complaint."
        >
          <div className="flex flex-wrap gap-2.5">
            {issueTypes.map((type) => {
              const selected = selectedIssueTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleIssueType(type)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    selected
                      ? 'border-[#2f2151] bg-[#2f2151] text-white'
                      : 'border-[#dfe5eb] bg-white text-slate-600 hover:border-[#2f2151]/30 hover:text-[#2f2151]'
                  }`}
                >
                  {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {type}
                </button>
              );
            })}
          </div>
          {errors.issueTypes && <p className="text-xs text-rose-500">{errors.issueTypes.message}</p>}

          {/* Related staff field — shown conditionally */}
          {selectedIssueTypes.includes('Lecturer / Staff Conduct') && (
            <div className="mt-4 space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Name of Lecturer / Staff Involved <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Full name of the lecturer or staff member"
                {...register('relatedStaff')}
                className={`w-full rounded-[16px] border bg-[#f8fafb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white ${
                  errors.relatedStaff ? 'border-rose-300 bg-rose-50' : 'border-[#dfe5eb]'
                }`}
              />
              {errors.relatedStaff && <p className="text-xs text-rose-500">{errors.relatedStaff.message}</p>}
            </div>
          )}
        </Section>

        {/* Section 3 — Complaint details */}
        <Section
          title="3. Complaint Details"
          subtitle="Provide a clear subject and a full account of the issue, including relevant dates and context."
        >
          <div className="grid gap-5">
            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Subject / Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="Brief description of the issue"
                {...register('title')}
                className={`w-full rounded-[16px] border bg-[#f8fafb] px-4 py-3 text-sm outline-none transition focus:border-[#34b05a] focus:bg-white ${
                  errors.title ? 'border-rose-300 bg-rose-50' : 'border-[#dfe5eb]'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
            </div>

            {/* Date of incident */}
            <div className="space-y-1.5">
              <label htmlFor="incidentDate" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Date of Incident <span className="text-rose-500">*</span>
              </label>
              <input
                id="incidentDate"
                type="date"
                max={today}
                {...register('incidentDate')}
                className={`w-full rounded-[16px] border bg-[#f8fafb] px-4 py-3 text-sm outline-none transition focus:border-[#34b05a] focus:bg-white ${
                  errors.incidentDate ? 'border-rose-300 bg-rose-50' : 'border-[#dfe5eb]'
                }`}
              />
              {errors.incidentDate && <p className="text-xs text-rose-500">{errors.incidentDate.message}</p>}
            </div>

            {/* Full description */}
            <div className="space-y-1.5">
              <div className="flex items-end justify-between">
                <label htmlFor="description" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Full Description <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-medium ${descriptionValue.trim().length < 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {descriptionValue.trim().length} / 5000
                </span>
              </div>
              <textarea
                id="description"
                rows={7}
                placeholder="Describe the issue in full detail — include all events, dates, people involved, and any steps you have already taken."
                {...register('description')}
                className={`w-full resize-y rounded-[16px] border bg-[#f8fafb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white ${
                  errors.description ? 'border-rose-300 bg-rose-50' : 'border-[#dfe5eb]'
                }`}
              />
              {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
            </div>

            {/* Desired resolution */}
            <div className="space-y-1.5">
              <label htmlFor="desiredResolution" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Desired Resolution <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="desiredResolution"
                rows={3}
                placeholder="What outcome are you hoping for? Be specific."
                {...register('desiredResolution')}
                className={`w-full resize-y rounded-[16px] border bg-[#f8fafb] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#34b05a] focus:bg-white ${
                  errors.desiredResolution ? 'border-rose-300 bg-rose-50' : 'border-[#dfe5eb]'
                }`}
              />
              {errors.desiredResolution && <p className="text-xs text-rose-500">{errors.desiredResolution.message}</p>}
            </div>
          </div>
        </Section>

        {/* Section 4 — Attachments */}
        <Section
          title="4. Supporting Evidence"
          subtitle={`Attach any relevant documents or screenshots (max ${MAX_FILES} files, ${MAX_FILE_SIZE_MB}MB each).`}
        >
          <div className="space-y-4">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-[#dfe5eb] bg-[#f8fafb] px-6 py-8 transition hover:border-[#34b05a]/40 hover:bg-[#f4fcf6]"
            >
              <UploadCloud className="h-8 w-8 text-slate-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Click to upload or drag and drop</p>
                <p className="mt-1 text-xs text-slate-400">PDF, Word, JPG, PNG — up to {MAX_FILE_SIZE_MB}MB each</p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
                disabled={files.length >= MAX_FILES}
              />
            </label>

            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between rounded-[14px] border border-[#dfe5eb] bg-[#f8fafb] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="ml-3 text-slate-400 transition hover:text-rose-500">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {/* Section 5 — Declaration */}
        <Section
          title="5. Declaration"
          subtitle="Please read and confirm the declaration below before submitting."
        >
          <div className="rounded-[18px] border border-[#dfe5eb] bg-[#f8fafb] p-5">
            <p className="text-sm leading-relaxed text-slate-600">
              I, the undersigned, declare that the information provided in this complaint is true, complete, and accurate
              to the best of my knowledge. I understand that providing false information may result in disciplinary action.
              I also acknowledge that this complaint will be reviewed by the Head of Department of my registered department.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                {...register('declaration')}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#34b05a]"
              />
              <span className="text-sm font-medium text-slate-700">
                I confirm that all information provided is accurate and I agree to the KIU complaint policy.
              </span>
            </label>
            {errors.declaration && <p className="mt-2 text-xs text-rose-500">{errors.declaration.message}</p>}
          </div>
        </Section>

        {/* Submit */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Fields marked <span className="text-rose-500">*</span> are required.
          </p>
          <button
            id="submit-complaint"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2.5 rounded-[18px] bg-[#34b05a] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-16px_rgba(52,176,90,0.55)] transition hover:bg-[#2d9a4e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}
