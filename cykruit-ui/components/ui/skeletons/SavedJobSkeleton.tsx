import { Skeleton } from "@/components/ui/Skeleton";

export function SavedJobSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-5 w-16 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-5 w-14 rounded-lg" />
            </div>
          </div>
        </div>
        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

interface SavedJobSkeletonListProps {
  count?: number;
}

export function SavedJobSkeletonList({ count = 4 }: SavedJobSkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SavedJobSkeleton key={i} />
      ))}
    </div>
  );
}
