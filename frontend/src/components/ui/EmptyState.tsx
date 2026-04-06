import { LucideIcon, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionLink 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm border-dashed">
      <div className="bg-gray-50 p-6 rounded-full mb-6">
        <Icon className="h-12 w-12 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 truncate max-w-xs">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-sm text-sm">
        {description}
      </p>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center px-6 py-2.5 bg-[#008540] hover:bg-[#007036] text-white rounded-lg font-bold shadow-md shadow-primary-900/10 transition-all text-sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
