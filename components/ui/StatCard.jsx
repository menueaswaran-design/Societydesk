const TONES = {
  default: {
    chip: "bg-slate-100 text-slate-700 border border-slate-200/80",
    value: "text-slate-900",
    border: "border-slate-200/80",
  },
  brand: {
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20",
    value: "text-slate-900",
    border: "border-emerald-100/80",
  },
  green: {
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20",
    value: "text-emerald-700",
    border: "border-emerald-100/80",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-500/20",
    value: "text-amber-700",
    border: "border-amber-100/80",
  },
  red: {
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20",
    value: "text-rose-700",
    border: "border-rose-100/80",
  },
  blue: {
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-500/20",
    value: "text-sky-700",
    border: "border-sky-100/80",
  },
  violet: {
    chip: "bg-violet-50 text-violet-700 ring-1 ring-violet-500/20",
    value: "text-violet-700",
    border: "border-violet-100/80",
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
      className={`group relative overflow-hidden rounded-2xl border ${t.border ?? "border-slate-200/80"} bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-300/80 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        {Icon ? (
          <span
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 [&_svg]:size-4.5 ${t.chip}`}
          >
            <Icon />
          </span>
        ) : null}
      </div>

      <p className={`tabular mt-2.5 text-2xl sm:text-[26px] font-extrabold tracking-tight ${t.value}`}>
        {value}
      </p>

      {hint ? <p className="mt-1 text-xs text-slate-500 font-medium">{hint}</p> : null}
      {footer ? <div className="mt-3 pt-2.5 border-t border-slate-100">{footer}</div> : null}
    </div>
  );
}

export default StatCard;
