export default function Loading() {
  return (
    <div className="stack animate-pulse">
      {/* Hero Welcome banner skeleton */}
      <div className="h-32 sm:h-36 w-full rounded-xl bg-slate-200/80" />

      {/* Metric cards / snapshot skeleton */}
      <div className="surface p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="h-7 w-24 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="surface flex items-center gap-3 rounded-lg p-3.5 sm:p-4">
            <div className="size-9.5 shrink-0 rounded-lg bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Table / content section skeleton */}
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="space-y-1">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-100 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between pt-3">
              <div className="space-y-1">
                <div className="h-3.5 w-40 rounded bg-slate-200" />
                <div className="h-3 w-28 rounded bg-slate-100" />
              </div>
              <div className="h-3.5 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

