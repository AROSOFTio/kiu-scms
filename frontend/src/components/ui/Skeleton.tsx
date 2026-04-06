

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200/60";
  const variantClasses = variant === 'circular' ? "rounded-full" : "rounded-lg";
  
  return <div className={`${baseClasses} ${variantClasses} ${className}`} />;
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-6 border-b border-gray-50">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex space-x-2">
           <Skeleton className="h-3 w-16" />
           <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-6" variant="circular" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12" variant="circular" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
