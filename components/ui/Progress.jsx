const TRACKS = {
  brand: "bg-brand-600",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

const FILLS = {
  brand: "bg-linear-to-r from-brand-500 to-accent-500",
  green: "bg-linear-to-r from-emerald-500 to-teal-400",
  amber: "bg-linear-to-r from-amber-500 to-orange-400",
  rose: "bg-linear-to-r from-rose-500 to-pink-400",
  sky: "bg-linear-to-r from-sky-500 to-cyan-400",
  violet: "bg-linear-to-r from-violet-500 to-fuchsia-400",
};

/** Horizontal progress bar with an optional label on the right. */
export function Progress({ value, tone = "brand", label, className = "", size = "md" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2" };

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">{label}</span>
          <span className="tabular font-semibold text-slate-800">{pct}%</span>
        </div>
      ) : null}
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
    >
      <div
        className={`absolute top-0 left-0 h-full transition-[width] duration-300 ${FILLS[tone] ?? TRACKS[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
    </div>
  );
}

const RING_TONES = {
  brand: "stroke-brand-500",
  green: "stroke-emerald-500",
  amber: "stroke-amber-500",
  rose: "stroke-rose-500",
  sky: "stroke-sky-500",
  violet: "stroke-violet-500",
};

const RING_TEXT = {
  brand: "text-slate-900",
  green: "text-emerald-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  sky: "text-sky-600",
  violet: "text-violet-600",
};

/** Circular progress gauge, used for collection rate and notice read rate. */
export function ProgressRing({
  value,
  tone = "brand",
  size = 120,
  thickness = 10,
  label,
  caption,
  className = "",
}) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className="stroke-slate-200/80"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={`transition-[stroke-dashoffset] duration-700 ease-out ${RING_TONES[tone] ?? RING_TONES.brand}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`tabular text-2xl leading-none font-semibold tracking-tight ${RING_TEXT[tone] ?? RING_TEXT.brand}`}
        >
          {label ?? `${Math.round(pct)}%`}
        </span>
        {caption ? (
          <span className="mt-1 px-3 text-[11px] leading-tight text-slate-500">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}

export { TRACKS };
