import Link from "next/link";

/** Full-width call-to-action row that links to a related screen. */
export default function LinkRow({ href, title, caption, icon: Icon, className = "" }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5 transition-all duration-150 hover:bg-white hover:ring-brand-200 hover:shadow-soft ${className}`}
    >
      {Icon ? (
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-soft ring-1 ring-slate-900/5">
          <Icon className="size-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-slate-800">{title}</span>
        {caption ? (
          <span className="mt-0.5 block truncate text-xs text-slate-500">{caption}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-xs font-semibold text-brand-600 transition-transform duration-150 group-hover:translate-x-0.5">
        Open
      </span>
    </Link>
  );
}
