import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileText,
  Upload, 
  X, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2
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
      setTimeout(() => navigate('/dashboard/student/complaints'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted!</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Your complaint has been successfully registered. You will be redirected to your complaints list shortly.
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate('/dashboard/student/complaints')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium"
          >
            Go to My Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 bg-[#008540] text-white">
          <h1 className="text-2xl font-bold">Submit a New Complaint</h1>
          <p className="opacity-90 mt-1">Please provide clear details so we can assist you better.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Complaint Category</label>
              <select
                {...register('categoryId')}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                  errors.categoryId ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Priority Level</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Subject / Title</label>
            <input
              type="text"
              {...register('title')}
              placeholder="Brief summary of the issue"
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">Detailed Description</label>
              <span className={`text-[10px] font-bold ${descriptionValue.length < 20 ? 'text-red-500' : 'text-emerald-500'}`}>
                {descriptionValue.length} characters
              </span>
            </div>
            <textarea
              {...register('description')}
              rows={6}
              placeholder="Provide all relevant details, including dates, locations, and names if applicable."
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Attachments (Optional)</label>
            <div className="mt-1 flex flex-col space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 5 files, 10MB each)</p>
                  </div>
                  <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="h-4 w-4 text-primary-500 mr-2 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(index)} className="p-1 hover:bg-gray-200 rounded text-gray-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-[#008540] hover:bg-[#007036] text-white rounded-lg font-bold shadow-md shadow-primary-900/10 transition-all flex items-center disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
