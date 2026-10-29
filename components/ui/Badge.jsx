const TONES = {
  slate: "bg-neutral-100 text-neutral-700 ring-neutral-900/10",
  green: "bg-success-50 text-success-700 ring-success-600/20",
  amber: "bg-warning-50 text-warning-700 ring-warning-600/25",
  red: "bg-error-50 text-error-700 ring-error-600/20",
  blue: "bg-info-50 text-info-700 ring-info-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
};

const DOTS = {
  slate: "bg-neutral-400",
  green: "bg-success-500",
  amber: "bg-warning-500",
  red: "bg-error-500",
  blue: "bg-info-500",
  violet: "bg-violet-500",
  brand: "bg-brand-600",
};

export default function Badge({ tone = "slate", dot = false, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap shadow-2xs ring-1 ring-inset ${TONES[tone] ?? TONES.slate} ${className}`}
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
