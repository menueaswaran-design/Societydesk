const TONES = {
  default: {
    chip: "bg-slate-100 text-slate-500",
    value: "text-slate-900",
    glow: "",
  },
  brand: {
    chip: "bg-slate-100 text-slate-600",
    value: "text-slate-900",
    glow: "before:from-slate-500/10",
  },
  green: {
    chip: "bg-emerald-50 text-emerald-600",
    value: "text-emerald-600",
    glow: "before:from-emerald-500/10",
  },
  amber: {
    chip: "bg-amber-50 text-amber-600",
    value: "text-amber-600",
    glow: "before:from-amber-500/12",
  },
  red: {
    chip: "bg-rose-50 text-rose-600",
    value: "text-rose-600",
    glow: "before:from-rose-500/10",
  },
  blue: {
    chip: "bg-sky-50 text-sky-600",
    value: "text-sky-600",
    glow: "before:from-sky-500/10",
  },
  violet: {
    chip: "bg-violet-50 text-violet-600",
    value: "text-violet-600",
    glow: "before:from-violet-500/10",
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
      className={`surface animate-rise group relative overflow-hidden p-5 transition-shadow duration-150 hover:shadow-lift ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label-xs">{label}</p>
        {Icon ? (
          <span
            className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 [&_svg]:size-4 ${t.chip}`}
          >
            <Icon />
          </span>
        ) : null}
      </div>

      <p className={`tabular mt-3 text-[26px] leading-none font-semibold tracking-tight ${t.value}`}>
        {value}
      </p>

      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}

export default StatCard;
