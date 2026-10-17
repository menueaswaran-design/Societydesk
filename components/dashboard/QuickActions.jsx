import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";

const TONES = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
};

/**
 * Large touch-friendly shortcut tiles. The main "flow" of every dashboard:
 * one glance shows the user what they can do, with the count right on it.
 */
export function QuickActions({ items, className = "" }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <QuickAction key={item.href} {...item} />
      ))}
    </div>
  );
}

export function QuickAction({ href, icon: Icon, title, caption, tone = "brand", badge }) {
  const t = TONES[tone] ?? TONES.brand;
  return (
    <Link
      href={href}
      className="surface animate-rise group flex items-center gap-3 rounded-lg p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:p-4"
    >
      <span
        className={`inline-flex size-9.5 shrink-0 items-center justify-center rounded-lg ring-1 [&_svg]:size-4.5 ${t}`}
      >
        <Icon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-semibold text-slate-900 leading-tight sm:text-sm">
            {title}
          </span>
          {badge ? (
            <span className="shrink-0">
              <Badge tone="brand" className="text-[10px] px-1.5 py-0.2">{badge}</Badge>
            </span>
          ) : null}
        </span>
        {caption ? (
          <span className="mt-0.5 block text-xs text-slate-500 leading-normal">
            {caption}
          </span>
        ) : null}
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-slate-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </Link>
  );
}

export default QuickActions;