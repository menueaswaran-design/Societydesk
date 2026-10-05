import Link from "next/link";

function Chip({ active, children, className = "" }) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-150 ${
        active
          ? "bg-brand-600 text-white shadow-glow"
          : "bg-white text-slate-600 ring-1 ring-slate-900/8 hover:bg-slate-50 hover:text-slate-900"
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** Server-side filter pills: each option is a link so state stays in the URL. */
export default function FilterPills({ options, className = "", trailing = null }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((o) =>
        o.href ? (
          <Link key={o.value ?? o.label} href={o.href} scroll={false}>
            <Chip active={o.active}>{o.label}</Chip>
          </Link>
        ) : (
          <button key={o.value ?? o.label} onClick={o.onClick} type="button">
            <Chip active={o.active}>{o.label}</Chip>
          </button>
        )
      )}
      {trailing ? <div className="ml-auto flex items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

/** Client-side variant where the active value lives in React state. */
export function FilterChips({ options, value, onChange, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:outline-none ${
            value === o.value
              ? "bg-brand-600 text-white shadow-glow"
              : "bg-white text-slate-600 ring-1 ring-slate-900/8 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
