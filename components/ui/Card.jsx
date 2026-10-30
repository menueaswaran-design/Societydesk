export function Card({ className = "", hover = false, children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white shadow-2xs overflow-hidden ${hover ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-neutral-300" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 sm:py-4 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon ? (
          <span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 text-neutral-700 shadow-2xs [&_svg]:size-4">
            <Icon />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-neutral-900 sm:text-[15px]">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-neutral-500 font-medium">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

/** Neutral inset block used for summaries, amounts and inline notices. */
export function CardNote({ tone = "slate", icon: Icon, title, children, className = "" }) {
  const tones = {
    slate: "bg-slate-50/80 ring-slate-900/5 text-slate-600",
    brand: "bg-brand-50/70 ring-brand-200/70 text-brand-900",
    emerald: "bg-emerald-50/70 ring-emerald-200/70 text-emerald-900",
    amber: "bg-amber-50/70 ring-amber-200/70 text-amber-900",
    rose: "bg-rose-50/70 ring-rose-200/70 text-rose-900",
  };
  const iconTones = {
    slate: "text-slate-400",
    brand: "text-brand-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };

  return (
    <div
      className={`flex gap-3 rounded-lg px-4 py-3.5 text-sm ring-1 ${tones[tone] ?? tones.slate} ${className}`}
    >
      {Icon ? <Icon className={`mt-0.5 size-4 shrink-0 ${iconTones[tone]}`} /> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={title ? "mt-0.5 text-xs opacity-90" : "text-xs opacity-90"}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Two-column label/value block used across dashboards and detail modals. */
export function StatLine({ label, value, tone = "default" }) {
  const tones = {
    default: "text-slate-900",
    muted: "text-slate-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    brand: "text-brand-700",
  };
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] sm:text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`tabular font-semibold ${tones[tone] ?? tones.default}`}>{value}</span>
    </div>
  );
}

export default Card;
