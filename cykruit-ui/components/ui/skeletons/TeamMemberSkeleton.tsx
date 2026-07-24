import { Skeleton } from "@/components/ui/Skeleton";

export function TeamMemberRowSkeleton() {
  return (
    <li className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-6 w-20 rounded-lg shrink-0" />
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
    </li>
  );
}

interface TeamMemberListSkeletonProps {
  count?: number;
}

export function TeamMemberListSkeleton({ count = 4 }: TeamMemberListSkeletonProps) {
  return (
    <ul className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <TeamMemberRowSkeleton key={i} />
      ))}
    </ul>
  );
}
