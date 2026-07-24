import { Skeleton } from "@/components/ui/Skeleton";

/** One row for application list (seeker) */
export function ApplicationRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-1.5 min-w-0">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="h-6 w-20 rounded-lg hidden sm:block" />
        <Skeleton className="h-6 w-16 rounded-lg" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

/** One row for employer jobs table */
export function JobTableRowSkeleton() {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <Skeleton className="h-3.5 w-36 mb-1.5" />
        <Skeleton className="h-3 w-20" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <Skeleton className="h-3.5 w-20" />
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <Skeleton className="h-3.5 w-24" />
      </td>
      <td className="px-4 py-3.5 text-center">
        <Skeleton className="h-3.5 w-6 mx-auto" />
      </td>
      <td className="px-4 py-3.5 text-center hidden sm:table-cell">
        <Skeleton className="h-3.5 w-8 mx-auto" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-6 w-16 rounded-lg" />
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-6 w-8 rounded-lg" />
      </td>
    </tr>
  );
}

/** One row for employer applicants table */
export function ApplicantTableRowSkeleton() {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <Skeleton className="h-3.5 w-32" />
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <Skeleton className="h-3.5 w-28" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-6 w-20 rounded-lg" />
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-7 w-16 rounded-lg" />
      </td>
    </tr>
  );
}

interface ApplicationListSkeletonProps {
  count?: number;
}

export function ApplicationListSkeleton({ count = 5 }: ApplicationListSkeletonProps) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <ApplicationRowSkeleton key={i} />
      ))}
    </div>
  );
}

interface JobTableSkeletonProps {
  count?: number;
}

export function JobTableSkeleton({ count = 5 }: JobTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <JobTableRowSkeleton key={i} />
      ))}
    </>
  );
}

interface ApplicantTableSkeletonProps {
  count?: number;
}

export function ApplicantTableSkeleton({ count = 5 }: ApplicantTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ApplicantTableRowSkeleton key={i} />
      ))}
    </>
  );
}
