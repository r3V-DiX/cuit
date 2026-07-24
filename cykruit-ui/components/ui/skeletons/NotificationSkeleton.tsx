import { Skeleton } from "@/components/ui/Skeleton";

export function NotificationRowSkeleton() {
  return (
    <div className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-4">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

interface NotificationListSkeletonProps {
  count?: number;
}

export function NotificationListSkeleton({ count = 5 }: NotificationListSkeletonProps) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationRowSkeleton key={i} />
      ))}
    </div>
  );
}
