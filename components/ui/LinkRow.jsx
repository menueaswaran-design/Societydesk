import Link from "next/link";

/** Full-width call-to-action row that links to a related screen. */
export default function LinkRow({ href, title, caption, icon: Icon, className = "" }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 shadow-2xs transition-all duration-150 hover:bg-white hover:border-emerald-300 hover:shadow-xs ${className}`}
    >
      {Icon ? (
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-2xs border border-slate-200/70">
          <Icon className="size-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-slate-900 leading-snug">{title}</span>
        {caption ? (
          <span className="mt-0.5 block text-xs text-slate-500 leading-snug">{caption}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-xs font-semibold text-emerald-700 transition-transform duration-150 group-hover:translate-x-0.5">
        Open
      </span>
    </Link>
  );
}
