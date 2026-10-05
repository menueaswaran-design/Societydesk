const TONES = {
  slate: "bg-slate-100 text-slate-600 ring-slate-900/5",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
};

const DOTS = {
  slate: "bg-slate-400",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
  brand: "bg-brand-500",
};

export default function Badge({ tone = "slate", dot = false, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-wide whitespace-nowrap ring-1 ring-inset ${TONES[tone] ?? TONES.slate} ${className}`}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${DOTS[tone] ?? DOTS.slate}`}
        />
      ) : null}
      {children}
    </span>
  );
}
