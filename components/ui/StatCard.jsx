const TONES = {
  default: {
    chip: "bg-neutral-100 text-neutral-600",
    value: "text-neutral-900",
    border: "border-neutral-200",
  },
  brand: {
    chip: "bg-brand-50 text-brand-700 ring-1 ring-brand-600/20",
    value: "text-brand-700",
    border: "border-neutral-200",
  },
  green: {
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    value: "text-emerald-700",
    border: "border-neutral-200",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    value: "text-amber-700",
    border: "border-neutral-200",
  },
  red: {
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
    value: "text-rose-700",
    border: "border-neutral-200",
  },
  blue: {
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    value: "text-sky-700",
    border: "border-neutral-200",
  },
  violet: {
    chip: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
    value: "text-violet-700",
    border: "border-neutral-200",
  },
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
  className = "",
  footer,
}) {
  const t = TONES[tone] ?? TONES.default;

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden min-w-0 rounded-2xl border ${t.border ?? "border-neutral-200"} bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:shadow-xs ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate" title={label}>
            {label}
          </span>
          {Icon ? (
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 [&_svg]:size-4 ${t.chip}`}
            >
              <Icon />
            </span>
          ) : null}
        </div>

        <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums truncate ${t.value}`} title={String(value)}>
          {value}
        </p>
      </div>

      {hint ? (
        <div className="mt-2 text-xs font-medium text-neutral-500 truncate" title={typeof hint === "string" ? hint : undefined}>
          {hint}
        </div>
      ) : null}
      {footer ? <div className="mt-3 pt-2.5 border-t border-neutral-100 min-w-0">{footer}</div> : null}
    </div>
  );
}

export default StatCard;
