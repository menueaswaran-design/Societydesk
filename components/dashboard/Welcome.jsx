/**
 * Welcome hero banner used at the top of every dashboard. Replaces the
 * plain PageHeader so each role lands on a single, friendly action point.
 */
export default function Welcome({ eyebrow, title, description, badge, actions, className = "" }) {
  return (
    <section
      className={`animate-rise relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 text-white shadow-card sm:px-8 sm:py-10 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-brand-400/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-brand-600/25 blur-3xl"
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-brand-300 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[30px] leading-tight font-semibold text-white sm:text-[34px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-white/65">
              {description}
            </p>
          ) : null}
        </div>

        {badge || actions ? (
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            {badge ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15">
                {badge}
              </span>
            ) : null}
            {actions ? (
              <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}