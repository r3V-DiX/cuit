import { Skeleton } from "@/components/ui/Skeleton";

export function ActivityLogRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-3">
        <Skeleton className="h-3.5 w-28 mb-1" />
        <Skeleton className="h-3 w-36" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3.5 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3.5 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-md" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-md" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3 w-24" />
      </td>
    </tr>
  );
}

export function AuthLogRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-3">
        <Skeleton className="h-3.5 w-28 mb-1" />
        <Skeleton className="h-3 w-36" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3.5 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-md" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3.5 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3 w-24 font-mono" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-3 w-24" />
      </td>
    </tr>
  );
}

interface ActivityLogSkeletonProps {
  count?: number;
}

export function ActivityLogSkeleton({ count = 8 }: ActivityLogSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ActivityLogRowSkeleton key={i} />
      ))}
    </>
  );
}

export function AuthLogSkeleton({ count = 8 }: ActivityLogSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <AuthLogRowSkeleton key={i} />
      ))}
    </>
  );
}
