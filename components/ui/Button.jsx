const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:scale-[0.98] focus-visible:outline-brand-600",
  brand:
    "bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:scale-[0.98] focus-visible:outline-brand-600",
  accent:
    "bg-brand-700 text-white shadow-xs hover:bg-brand-800 active:scale-[0.98] focus-visible:outline-brand-700",
  secondary:
    "bg-brand-100 text-brand-700 hover:bg-brand-200 active:scale-[0.98] focus-visible:outline-brand-500",
  outline:
    "bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 focus-visible:outline-brand-500",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger:
    "bg-error-600 text-white shadow-xs hover:bg-error-700 active:scale-[0.98] focus-visible:outline-error-600",
  "danger-ghost":
    "text-error-600 hover:bg-error-50 hover:text-error-700 focus-visible:outline-error-600",
  success:
    "bg-success-600 text-white shadow-xs hover:bg-success-700 active:scale-[0.98] focus-visible:outline-success-600",
  subtle: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80",
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
      className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 select-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
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
  ghost: "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800",
  brand: "text-neutral-400 hover:bg-brand-50 hover:text-brand-700",
  danger: "text-neutral-400 hover:bg-error-50 hover:text-error-600",
  success: "text-neutral-400 hover:bg-success-50 hover:text-success-600",
  warning: "text-neutral-400 hover:bg-warning-50 hover:text-warning-600",
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
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 ${ICON_VARIANTS[variant] ?? ICON_VARIANTS.ghost} ${sizes[size] ?? sizes.md} ${className}`}
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
    neutral: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
    danger: "text-error-600 hover:bg-error-50",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${tones[tone] ?? tones.brand} ${className}`}
      {...props}
    />
  );
}
