import { LucideIcon, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
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
    <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-sm">
        <Icon className="h-7 w-7 text-slate-300" />
      </div>
      <h3 className="max-w-md text-lg font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="mt-6 inline-flex items-center rounded-[16px] bg-[#34b05a] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2d9a4e]"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
