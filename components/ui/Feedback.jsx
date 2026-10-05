import { AlertCircle, Inbox, RotateCw } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = Inbox,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${compact ? "py-8" : "py-16"}`}
    >
      <span className="relative mb-4 inline-flex">
        <span className="relative inline-flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200 [&_svg]:size-5">
          <Icon />
        </span>
      </span>
      <p className="text-[15px] font-semibold text-slate-800">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ error, onRetry, className = "" }) {
  if (!error) return null;
  const message = typeof error === "string" ? error : (error.message ?? "Request failed");

  return (
    <div
      role="alert"
      className={`animate-pop flex items-start gap-3 rounded-lg bg-rose-50/80 px-4 py-3 text-sm ring-1 ring-rose-200/80 ${className}`}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-rose-900">Something went wrong</p>
        <p className="mt-0.5 text-[13px] break-words text-rose-700">{message}</p>
      </div>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          <RotateCw className="size-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function SuccessBanner({ title, children, icon: Icon, className = "" }) {
  return (
    <div
      className={`animate-pop flex items-start gap-3 rounded-lg bg-emerald-50/80 px-4 py-3 text-sm ring-1 ring-emerald-200/80 ${className}`}
    >
      {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold text-emerald-900">{title}</p> : null}
        {children ? (
          <div className="mt-0.5 text-[13px] text-emerald-700">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Loading({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500">
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${i * 120}ms`, animationDuration: "900ms" }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}

/** Shimmering placeholder block. */
export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer rounded-lg bg-slate-200/70 bg-linear-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] ${className}`}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-40" : "w-24"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
