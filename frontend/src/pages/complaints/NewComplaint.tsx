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
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

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
  issueType: z.enum(issueTypes, { required_error: 'Select the complaint type' }),
  facultyId: z.string().min(1, 'Select a school or faculty'),
  departmentId: z.string().min(1, 'Select a department'),
  relatedStaff: z.string().max(120, 'Keep this field under 120 characters').optional().or(z.literal('')),
  targetOffice: z.string().optional().or(z.literal('')),
  title: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject must be under 200 characters'),
  description: z.string().min(40, 'Provide a detailed description with at least 40 characters'),
  incidentDate: z.string().min(1, 'Select the date of incident'),
  desiredResolution: z.string().min(10, 'Describe the desired resolution'),
  declaration: z.boolean().refine((value) => value === true, 'You must confirm the declaration'),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

type Category = { id: number; name: string; description?: string };
type Faculty = { id: number; name: string };
type Department = { id: number; name: string; faculty_name: string };

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
    <section className="space-y-5 border-b border-slate-200 pb-10 last:border-b-0 last:pb-0">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function mapIssueTypeToCategoryId(issueType: ComplaintFormData['issueType'], categories: Category[]) {
  const normalized = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category.name.toLowerCase()] = category.id;
    return acc;
  }, {});

  const categoryName =
    issueType === 'Marks / Results' || issueType === 'Exams'
      ? 'academic'
      : issueType === 'Tuition / Finance'
        ? 'financial'
        : issueType === 'ICT / Portal'
          ? 'technical'
          : issueType === 'Welfare / Hostel'
            ? 'hostel'
            : issueType === 'Lecturer / Staff conduct' || issueType === 'Registration'
              ? 'administration'
              : 'other';

  return normalized[categoryName] || normalized.other;
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
      issueType: 'Marks / Results',
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

  const issueType = watch('issueType');
  const facultyId = watch('facultyId');
  const descriptionValue = watch('description') || '';

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
      } catch (err) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setFiles((current) => [...current, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ComplaintFormData) => {
    const categoryId = mapIssueTypeToCategoryId(data.issueType, categories);

    if (!categoryId) {
      toast.error('Complaint categories are not configured correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      const facultyName = faculties.find((faculty) => String(faculty.id) === data.facultyId)?.name || '';
      const departmentName = departments.find((department) => String(department.id) === data.departmentId)?.name || '';
      const composedDescription = [
        `Issue Type: ${data.issueType}`,
        `School / Faculty: ${facultyName}`,
        `Department: ${departmentName}`,
        `Related Lecturer / Staff: ${data.relatedStaff || 'Not specified'}`,
        `Target Office: ${data.targetOffice || 'Not specified'}`,
        `Date of Incident: ${data.incidentDate}`,
        `Desired Resolution: ${data.desiredResolution}`,
        '',
        'Complaint Details:',
        data.description.trim(),
      ].join('\n');

      const formData = new FormData();
      formData.append('title', data.title.trim());
      formData.append('categoryId', String(categoryId));
      formData.append('priority', 'Medium');
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
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-semibold text-slate-900">Complaint submitted</h2>
        <p className="mt-3 max-w-md text-center text-sm text-slate-500">
          Your complaint has been recorded and will appear in your complaint list shortly.
        </p>
        <button
          onClick={() => navigate('/dashboard/student/complaints')}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Open complaints
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-emerald-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-semibold text-slate-900">Formal complaint form</h1>
          <p className="mt-2 text-sm text-slate-500">Provide clear and accurate information for review.</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Complaint submission only
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 p-6 sm:p-8 lg:p-10">

          <Section title="Section A: Complaint Type" subtitle="Select the issue that best matches your complaint.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {issueTypes.map((option) => {
                const active = issueType === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue('issueType', option, { shouldValidate: true })}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-medium">{option}</p>
                  </button>
                );
              })}
            </div>
            {errors.issueType && <p className="text-sm text-rose-600">{errors.issueType.message}</p>}
            <input type="hidden" {...register('issueType')} />
          </Section>

          <Section title="Section B: Complaint Context" subtitle="Identify where the complaint arose and who or which office is involved.">
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

          <Section title="Section C: Complaint Details" subtitle="Provide a clear summary, a complete description, and the action you are requesting.">
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
                  <span className={`text-xs ${descriptionValue.length < 40 ? 'text-rose-500' : 'text-emerald-700'}`}>
                    {descriptionValue.length}/40 minimum
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

          <Section title="Section D: Attachments" subtitle="Upload supporting evidence if available. Maximum 5 files.">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-medium text-slate-900">Upload evidence</p>
                <p className="mt-2 text-sm text-slate-500">PDF, JPG, PNG, DOC, DOCX</p>
                <p className="mt-1 text-xs text-slate-400">Maximum 10MB per file</p>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
              </label>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  Attached files
                </div>

                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
                    No files attached
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Section E: Declaration" subtitle="Confirm that the information provided is accurate to the best of your knowledge.">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                {...register('declaration')}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm leading-6 text-slate-600">
                I confirm that the information submitted in this complaint is true and accurate to the best of my knowledge.
              </span>
            </label>
            {errors.declaration && <p className="text-sm text-rose-600">{errors.declaration.message}</p>}
          </Section>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
