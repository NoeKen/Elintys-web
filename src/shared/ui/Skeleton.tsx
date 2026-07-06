import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'avatar';
  className?: string;
}

export function Skeleton({ variant = 'line', className }: SkeletonProps) {
  const base = 'animate-pulse bg-surface-low';

  if (variant === 'circle') return <div className={cn(base, 'rounded-full w-10 h-10', className)} />;
  if (variant === 'avatar') return <div className={cn(base, 'rounded-full w-8 h-8', className)} />;
  if (variant === 'card') return (
    <div className={cn(base, 'rounded-[14px] h-48 w-full', className)} />
  );
  return <div className={cn(base, 'rounded-md h-4 w-full', className)} />;
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-[14px] bg-surface-lowest p-4 flex flex-col gap-3">
      <Skeleton variant="card" className="h-40" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function VendorCardSkeleton() {
  return (
    <div className="rounded-[14px] bg-surface-lowest p-4 flex flex-col gap-3">
      <Skeleton variant="card" className="h-32" />
      <div className="flex items-center gap-2">
        <Skeleton variant="avatar" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[14px] bg-surface-lowest p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    </div>
  );
}
