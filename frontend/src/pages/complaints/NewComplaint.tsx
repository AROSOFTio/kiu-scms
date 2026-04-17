import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
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
  'Lecturer / Staff conduct',
  'Registration',
  'ICT / Portal',
  'Welfare / Hostel',
  'Other',
] as const;

const officeOptions = [
  'Exams Office',
  'Lecturer',
  'Department',
  'Finance',
  'Registry',
  'ICT',
  'Welfare',
  'Other Unit',
] as const;

const complaintSchema = z.object({
  issueTypes: z.array(z.enum(issueTypes)).min(1, 'Select at least one complaint type'),
  facultyId: z.string().min(1, 'Select a school or faculty'),
  departmentId: z.string().min(1, 'Select a department'),
  relatedStaff: z.string().trim().max(120, 'Keep this field under 120 characters').optional(),
  targetOffice: z.string().trim().max(80, 'Keep this field under 80 characters').optional(),
  title: z.string().trim().min(8, 'Subject must be at least 8 characters').max(200, 'Subject must be under 200 characters'),
  description: z.string().trim().min(60, 'Provide a detailed description with at least 60 characters').max(5000, 'Description is too long'),
  incidentDate: z.string().min(1, 'Select the date of incident'),
  desiredResolution: z.string().trim().min(20, 'Describe the desired resolution with at least 20 characters').max(800, 'Resolution details are too long'),
  declaration: z.boolean().refine((value) => value === true, 'You must confirm the declaration'),
}).superRefine((data, ctx) => {
  if (data.issueTypes.includes('Lecturer / Staff conduct') && !data.relatedStaff?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['relatedStaff'],
      message: 'Provide the related lecturer or staff name for this complaint type',
    });
  }

  if (data.incidentDate) {
    const incident = new Date(`${data.incidentDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

type Category = { id: number; name: string; description?: string };
type Faculty = { id: number; name: string };
type Department = { id: number; name: string; faculty_name: string };

function getFileExtension(filename: string) {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

function getCategoryNameFromIssueType(issueType: (typeof issueTypes)[number]) {
  if (issueType === 'Marks / Results' || issueType === 'Exams') return 'academic';
  if (issueType === 'Tuition / Finance') return 'financial';
  if (issueType === 'ICT / Portal') return 'technical';
  if (issueType === 'Welfare / Hostel') return 'hostel';
  if (issueType === 'Lecturer / Staff conduct' || issueType === 'Registration') return 'administration';
  return 'other';
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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

function mapIssueTypesToCategoryId(selectedIssueTypes: ComplaintFormData['issueTypes'], categories: Category[]) {
  const normalized = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category.name.toLowerCase()] = category.id;
    return acc;
  }, {});

  const categoryNames = Array.from(new Set(selectedIssueTypes.map(getCategoryNameFromIssueType)));
  const categoryName = categoryNames.length === 1 ? categoryNames[0] : 'other';

  return normalized[categoryName] || normalized.other || null;
}

export default function NewComplaint() {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      facultyId: '',
      departmentId: '',
      relatedStaff: '',
      targetOffice: '',
      title: '',
      description: '',
      incidentDate: '',
      desiredResolution: '',
      declaration: false,
    },
  });

  const selectedIssueTypes = watch('issueTypes') || [];
  const facultyId = watch('facultyId');
  const descriptionValue = watch('description') || '';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [categoriesRes, facultiesRes, departmentsRes] = await Promise.all([
          api.get('/complaints/categories'),
          api.get('/auth/faculties'),
          api.get('/auth/departments'),
        ]);

        setCategories(categoriesRes.data.data || []);
        setFaculties(facultiesRes.data.data || []);
        setDepartments(departmentsRes.data.data || []);
      } catch {
        toast.error('Failed to load form options');
      }
    };
    fetchMeta();
  }, [toast]);

  const selectedFacultyName = faculties.find((faculty) => String(faculty.id) === facultyId)?.name;

  const filteredDepartments = useMemo(() => {
    if (!selectedFacultyName) return [];
    return departments.filter((department) => department.faculty_name === selectedFacultyName);
  }, [departments, selectedFacultyName]);

  useEffect(() => {
    setValue('departmentId', '');
  }, [facultyId, setValue]);

  const toggleIssueType = (issueType: (typeof issueTypes)[number]) => {
    const nextSelection = selectedIssueTypes.includes(issueType)
      ? selectedIssueTypes.filter((item) => item !== issueType)
      : [...selectedIssueTypes, issueType];

    setValue('issueTypes', nextSelection, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const incomingFiles = Array.from(e.target.files);
    const rejected: string[] = [];

    setFiles((current) => {
      const next = [...current];

      for (const file of incomingFiles) {
        if (next.length >= MAX_FILES) {
          rejected.push(`Maximum ${MAX_FILES} files allowed`);
          break;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          rejected.push(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB`);
          continue;
        }

        const ext = getFileExtension(file.name);
        if (!ALLOWED_FILE_EXTENSIONS.includes(ext as (typeof ALLOWED_FILE_EXTENSIONS)[number])) {
          rejected.push(`${file.name} has an unsupported file type`);
          continue;
        }

        const duplicate = next.some((existing) => existing.name === file.name && existing.size === file.size);
        if (duplicate) {
          rejected.push(`${file.name} is already attached`);
          continue;
        }

        next.push(file);
      }

      return next;
    });

    if (rejected.length > 0) {
      toast.error(rejected[0]);
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ComplaintFormData) => {
    const categoryId = mapIssueTypesToCategoryId(data.issueTypes, categories);

    if (!categoryId) {
      toast.error('Complaint categories are not configured correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      const facultyName = faculties.find((faculty) => String(faculty.id) === data.facultyId)?.name || '';
      const departmentName = departments.find((department) => String(department.id) === data.departmentId)?.name || '';
      const composedDescription = [
        `Issue Types: ${data.issueTypes.join(', ')}`,
        `School / Faculty: ${facultyName}`,
        `Department: ${departmentName}`,
        `Related Lecturer / Staff: ${data.relatedStaff?.trim() || 'Not specified'}`,
        `Target Office: ${data.targetOffice?.trim() || 'Not specified'}`,
        `Date of Incident: ${data.incidentDate}`,
        `Desired Resolution: ${data.desiredResolution.trim()}`,
        '',
        'Complaint Details:',
        data.description.trim(),
      ].join('\n');

      const formData = new FormData();
      formData.append('title', data.title.trim());
      formData.append('categoryId', String(categoryId));
      formData.append('departmentId', data.departmentId);
      formData.append('description', composedDescription);

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Complaint submitted successfully');
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/student/complaints'), 2200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-[#34b05a]/10 text-[#34b05a]">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-semibold text-slate-900">Complaint submitted</h2>
        <button
          onClick={() => navigate('/dashboard/student/complaints')}
          className="mt-8 inline-flex items-center gap-2 rounded-[18px] bg-[#34b05a] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2d9a4e]"
        >
          Open complaints
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col gap-2">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-[#34b05a]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-[30px] font-semibold text-slate-900">Submit Complaint</h1>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6 sm:p-7 lg:p-8">
          <Section title="Complaint Type" subtitle="Select all that apply.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {issueTypes.map((option) => {
                const active = selectedIssueTypes.includes(option);

                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center justify-between rounded-[18px] border px-4 py-4 text-left transition ${
                      active ? 'border-[#34b05a] bg-[#34b05a]/8 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{option}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleIssueType(option)}
                      className="h-4 w-4 rounded border-slate-300 text-[#34b05a] focus:ring-[#34b05a]"
                    />
                  </label>
                );
              })}
            </div>
            {errors.issueTypes && <p className="text-sm text-rose-600">{errors.issueTypes.message}</p>}
          </Section>

          <Section title="Complaint Context" subtitle="Add the relevant context.">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">School / Faculty</label>
                <select
                  {...register('facultyId')}
                  className={`app-input ${errors.facultyId ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                >
                  <option value="">Select school / faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                {errors.facultyId && <p className="text-sm text-rose-600">{errors.facultyId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Department</label>
                <select
                  {...register('departmentId')}
                  disabled={!selectedFacultyName}
                  className={`app-input ${errors.departmentId ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''} ${!selectedFacultyName ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''}`}
                >
                  <option value="">Select department</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-sm text-rose-600">{errors.departmentId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Related lecturer / staff</label>
                <input
                  type="text"
                  {...register('relatedStaff')}
                  placeholder="Name if relevant"
                  className={`app-input ${errors.relatedStaff ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                />
                {errors.relatedStaff && <p className="text-sm text-rose-600">{errors.relatedStaff.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Complaint target office</label>
                <select {...register('targetOffice')} className="app-input">
                  <option value="">Select target office if relevant</option>
                  {officeOptions.map((office) => (
                    <option key={office} value={office}>
                      {office}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          <Section title="Complaint Details" subtitle="Provide the details.">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Subject / title</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Brief subject of the complaint"
                  className={`app-input ${errors.title ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                />
                {errors.title && <p className="text-sm text-rose-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date of incident</label>
                <input
                  type="date"
                  {...register('incidentDate')}
                  max={today}
                  className={`app-input ${errors.incidentDate ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                />
                {errors.incidentDate && <p className="text-sm text-rose-600">{errors.incidentDate.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Desired resolution</label>
                <input
                  type="text"
                  {...register('desiredResolution')}
                  placeholder="What outcome are you requesting?"
                  className={`app-input ${errors.desiredResolution ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                />
                {errors.desiredResolution && <p className="text-sm text-rose-600">{errors.desiredResolution.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Detailed description</label>
                  <span className={`text-xs ${descriptionValue.length < 60 ? 'text-rose-500' : 'text-[#34b05a]'}`}>
                    {descriptionValue.length}/60 minimum
                  </span>
                </div>
                <textarea
                  {...register('description')}
                  rows={8}
                  placeholder="Describe what happened, when it happened, and any relevant facts."
                  className={`app-input min-h-[220px] resize-y py-4 ${errors.description ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                />
                {errors.description && <p className="text-sm text-rose-600">{errors.description.message}</p>}
              </div>
            </div>
          </Section>

          <Section title="Attachments" subtitle="Upload supporting evidence if available.">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-[#34b05a]/50 hover:bg-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-slate-700 shadow-sm">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-medium text-slate-900">Upload evidence</p>
                <p className="mt-2 text-sm text-slate-500">PDF, JPG, PNG, DOC, DOCX</p>
                <p className="mt-1 text-xs text-slate-400">{MAX_FILES} files max, {MAX_FILE_SIZE_MB}MB each</p>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
              </label>

              <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  Attached files ({files.length}/{MAX_FILES})
                </div>

                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-[14px] p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[150px] items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
                    No files attached
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Declaration" subtitle="Confirm the information is accurate.">
            <label className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                {...register('declaration')}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#34b05a] focus:ring-[#34b05a]"
              />
              <span className="text-sm leading-6 text-slate-600">
                I confirm the information submitted is accurate to the best of my knowledge.
              </span>
            </label>
            {errors.declaration && <p className="text-sm text-rose-600">{errors.declaration.message}</p>}
          </Section>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-[18px] px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#34b05a] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2d9a4e] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  Submit complaint
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
