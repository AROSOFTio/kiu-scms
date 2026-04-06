import { useState } from 'react';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';

interface FeedbackFormProps {
  complaintId: string;
  onSuccess?: () => void;
  existingFeedback?: {
    rating: number;
    comments: string;
  };
}

export default function FeedbackForm({ complaintId, onSuccess, existingFeedback }: FeedbackFormProps) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState(existingFeedback?.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingFeedback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await api.post(`/complaints/${complaintId}/feedback`, { rating, comments });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && !isSubmitting) {
    return (
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
        <CheckCircle2 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Thank you for your feedback!</h3>
        <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto">Your input helps us improve the Student Complaint Management System for everyone.</p>
        
        <div className="flex justify-center gap-1 mt-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className={`h-5 w-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
          Rate our Resolution
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
        </h3>
        <p className="text-xs text-gray-500 mt-1">Please share your experience with how this complaint was handled.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform active:scale-95"
            >
              <Star 
                className={`h-10 w-10 transition-colors ${
                  star <= (hover || rating) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-200'
                }`} 
              />
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none min-h-[120px] resize-none"
            placeholder="Tell us what we did well or how we can improve..."
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="w-full mt-8 bg-[#008540] hover:bg-[#006d35] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary-900/10 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {isSubmitting ? 'Submitting...' : 'Send Feedback'}
          {!isSubmitting && <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
