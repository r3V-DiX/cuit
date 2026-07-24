import { Skeleton } from "@/components/ui/Skeleton";

export function ConversationRowSkeleton() {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-10 shrink-0" />
          </div>
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
}

interface ConversationListSkeletonProps {
  count?: number;
}

export function ConversationListSkeleton({ count = 5 }: ConversationListSkeletonProps) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationRowSkeleton key={i} />
      ))}
    </div>
  );
}
