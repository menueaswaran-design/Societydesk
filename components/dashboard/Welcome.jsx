/**
 * Welcome hero banner used at the top of every dashboard. Replaces the
 * plain PageHeader so each role lands on a single, friendly action point.
 */
export default function Welcome({ eyebrow, title, description, badge, actions, className = "" }) {
  return (
    <section
      className={`animate-rise relative overflow-hidden rounded-xl bg-slate-900 px-5 py-5 text-white shadow-card sm:px-6 sm:py-6 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-brand-400/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-brand-600/25 blur-3xl"
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-brand-300 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-xl text-xs sm:text-[13px] leading-relaxed text-white/70">
              {description}
            </p>
          ) : null}
        </div>

        {badge || actions ? (
          <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
            {badge ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                {badge}
              </span>
            ) : null}
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}