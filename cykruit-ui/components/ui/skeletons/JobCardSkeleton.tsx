import { Skeleton } from "@/components/ui/Skeleton";

export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-6 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>
    </div>
  );
}

interface JobCardSkeletonGridProps {
  count?: number;
}

export function JobCardSkeletonGrid({ count = 9 }: JobCardSkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
