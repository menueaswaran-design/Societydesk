import { ChevronDown } from "lucide-react";

const BASE =
  "w-full rounded-xl bg-white text-[13px] text-neutral-900 border border-[#D2D9E6] shadow-2xs transition-all duration-150 placeholder:text-neutral-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const FIELD =
  "h-9.5 px-3 aria-[invalid=true]:border-error-500 aria-[invalid=true]:focus:ring-error-400/20";

function Shell({ label, labelRight, error, hint, id, required, className = "", children, htmlFor }) {
  return (
    <div className={className}>
      {label || labelRight ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={htmlFor ?? id} className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
              {label}
              {required ? <span className="text-error-500">*</span> : null}
            </label>
          ) : <span />}
          {labelRight}
        </div>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-error-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  label,
  labelRight,
  error,
  hint,
  className = "",
  inputClassName = "",
  id,
  required,
  prefix,
  suffix,
  ...props
}) {
  const control = (
    <input
      id={id}
      aria-invalid={error ? "true" : undefined}
      className={`${BASE} ${FIELD} ${prefix ? "pl-9" : ""} ${suffix ? "pr-10" : ""} ${inputClassName}`}
      {...props}
    />
  );

  return (
    <Shell label={label} labelRight={labelRight} error={error} hint={hint} id={id} required={required} className={className}>
      {prefix || suffix ? (
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-neutral-400 [&_svg]:size-4">
              {prefix}
            </span>
          ) : null}
          {control}
          {suffix ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
              {suffix}
            </div>
          ) : null}
        </div>
      ) : (
        control
      )}
    </Shell>
  );
}

export function Textarea({
  label,
  error,
  hint,
  className = "",
  id,
  rows = 4,
  required,
  mono = false,
  ...props
}) {
  return (
    <Shell label={label} error={error} hint={hint} id={id} required={required} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        className={`${BASE} resize-y px-3 py-2.5 leading-relaxed focus:border-brand-600 focus:ring-3 focus:ring-brand-200 focus:outline-none aria-[invalid=true]:border-error-500 ${mono ? "font-mono text-xs" : ""}`}
        {...props}
      />
    </Shell>
  );
}

export function Select({
  label,
  error,
  hint,
  className = "",
  inputClassName = "",
  id,
  children,
  required,
  ...props
}) {
  return (
    <Shell label={label} error={error} hint={hint} id={id} required={required} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? "true" : undefined}
          className={`${BASE} ${FIELD} cursor-pointer appearance-none pr-9 focus:border-brand-600 focus:ring-3 focus:ring-brand-200 focus:outline-none aria-[invalid=true]:border-error-500 ${inputClassName}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-neutral-400" />
      </div>
    </Shell>
  );
}

export function Checkbox({ label, description, className = "", id, ...props }) {
  return (
    <label
      htmlFor={id}
      className={`group flex cursor-pointer items-start gap-2.5 text-sm select-none ${className}`}
    >
      <span className="relative mt-0.5 flex size-4.5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className="peer size-4.5 cursor-pointer appearance-none rounded-md bg-white ring-1 ring-[#D2D9E6] transition checked:bg-brand-600 checked:ring-brand-600 hover:ring-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:outline-none aria-[invalid=true]:ring-error-400"
          {...props}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute size-3 scale-75 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
        >
          <path
            d="M3 8.5 6.5 12 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-neutral-700 group-hover:text-neutral-900">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-neutral-500">{description}</span> : null}
      </span>
    </label>
  );
}

export function Switch({ label, description, className = "", id, ...props }) {
  return (
    <label
      htmlFor={id}
      className={`group flex cursor-pointer items-center justify-between gap-4 text-sm select-none ${className}`}
    >
      <span className="min-w-0">
        <span className="block font-medium text-neutral-700 group-hover:text-neutral-900">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-neutral-500">{description}</span> : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          {...props}
        />
        <span className="h-6 w-11 rounded-full bg-neutral-200 ring-1 ring-neutral-300 transition-colors duration-200 peer-checked:bg-brand-600 peer-checked:ring-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Read-only key/value field for forms that show managed data. */
export function ReadOnlyField({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-semibold text-neutral-700">{label}</p>
      <div className="flex h-10 items-center rounded-lg bg-neutral-50 px-3 text-sm text-neutral-600 ring-1 ring-[#E5EAF3]">
        {value || "-"}
      </div>
    </div>
  );
}
