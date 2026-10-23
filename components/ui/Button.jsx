const VARIANTS = {
  primary:
    "bg-slate-900 text-white shadow-2xs hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-slate-900",
  brand:
    "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-emerald-600",
  accent:
    "bg-slate-800 text-white shadow-2xs hover:bg-slate-900 active:scale-[0.98] focus-visible:outline-slate-800",
  secondary:
    "bg-white text-slate-700 border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:outline-slate-500",
  outline:
    "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-500",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-rose-600 text-white shadow-2xs hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-rose-600",
  "danger-ghost":
    "text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-rose-600",
  success:
    "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-emerald-600",
  subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200/80",
};

const SIZES = {
  xs: "h-7.5 gap-1.5 px-2.5 text-xs font-semibold rounded-lg",
  sm: "h-8.5 gap-1.5 px-3 text-xs font-semibold rounded-lg",
  md: "h-9.5 gap-2 px-3.5 text-[13px] font-semibold rounded-xl",
  lg: "h-10.5 gap-2 px-4 text-sm font-semibold rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  disabled,
  as: Tag = "button",
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <Tag
      type={Tag === "button" ? type : undefined}
      disabled={Tag === "button" ? isDisabled : undefined}
      aria-disabled={Tag !== "button" && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 select-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </Tag>
  );
}

export function Spinner({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 ${className}`}
    />
  );
}

const ICON_VARIANTS = {
  ghost: "text-slate-400 hover:bg-slate-900/5 hover:text-slate-800",
  brand: "text-slate-400 hover:bg-brand-50 hover:text-brand-700",
  danger: "text-slate-400 hover:bg-rose-50 hover:text-rose-600",
  success: "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600",
  warning: "text-slate-400 hover:bg-amber-50 hover:text-amber-600",
};

/** Square icon-only control for dense table rows. */
export function IconButton({
  variant = "ghost",
  label,
  className = "",
  size = "md",
  type = "button",
  children,
  ...props
}) {
  const sizes = { xs: "size-7", sm: "size-8", md: "size-9" };
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 ${ICON_VARIANTS[variant] ?? ICON_VARIANTS.ghost} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Small pill button for inline row actions like "Open" or "Edit". */
export function TextAction({ tone = "brand", className = "", ...props }) {
  const tones = {
    brand: "text-brand-700 hover:bg-brand-50",
    neutral: "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900",
    danger: "text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${tones[tone] ?? tones.brand} ${className}`}
      {...props}
    />
  );
}
