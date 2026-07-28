import { Skeleton } from "@/components/ui/Skeleton";

// ─── Applications list page ───────────────────────────────────────────────────

export function ApplicationsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-9 rounded-xl" />
          <Skeleton className="w-28 h-9 rounded-xl shrink-0" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4">
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
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Application detail page ──────────────────────────────────────────────────

export function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-36" />

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <Skeleton className="h-3 w-32 mb-5" />
        <div className="flex items-center gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="h-3 w-16" />
              </div>
              {i < 2 && <Skeleton className="flex-1 h-0.5 mx-2 mb-5" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <Skeleton className="h-3 w-32 mb-5" />
            <div className="relative pl-5 space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-14 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <Skeleton className="h-3 w-16" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Saved jobs page ──────────────────────────────────────────────────────────

export function SavedPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-9 rounded-xl" />
          <Skeleton className="w-24 h-9 rounded-xl shrink-0" />
          <Skeleton className="w-20 h-9 rounded-xl shrink-0" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-14" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
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
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notifications page ───────────────────────────────────────────────────────

export function NotificationsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-7 w-28 rounded-lg shrink-0" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-4">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-12 shrink-0" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Messages page ────────────────────────────────────────────────────────────

export function MessagesPageSkeleton() {
  return (
    <>
      <div className="flex w-full md:w-80 shrink-0 border-r border-slate-200 bg-white flex-col">
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5">
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
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col bg-slate-50 min-w-0">
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
              <Skeleton className="w-8 h-8 rounded-xl shrink-0 self-end" />
              <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-40"}`} />
            </div>
          ))}
        </div>

        <div className="bg-white border-t border-slate-200 px-3 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="flex-1 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export function ProfilePageSkeleton() {
  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-5">
        <div className="flex items-start gap-4">
          <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-32 rounded-md" />
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-xl" />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-5 items-stretch">
      <div className="w-full md:w-52 md:shrink-0 bg-white rounded-2xl border border-slate-200 p-2 flex flex-row md:flex-col gap-0.5 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl shrink-0 md:w-full w-28" />
        ))}
      </div>

      <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <Skeleton className="h-4 w-40 mb-1.5" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard quick links + profile strength skeletons ───────────────────────

export function DashboardQuickLinksSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

export function DashboardProfileStrengthSkeleton() {
  return (
    <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-center gap-5 mb-4 flex-1">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-9 w-full rounded-xl mt-auto" />
    </div>
  );
}
