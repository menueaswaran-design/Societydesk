"use client";

/**
 * Minimal tab strip. Uncontrolled when `value` is not supplied, controlled when
 * it is. Renders a sliding indicator for the active tab.
 */
export default function Tabs({ tabs, value, onChange, className = "", size = "md" }) {
  const active = value ?? tabs.find((t) => t.active)?.id ?? tabs.find((t) => t.active)?.key;

  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 max-w-full overflow-x-auto scrollbar-none ${className}`}
    >
      {tabs.map((t) => {
        const tabId = t.id ?? t.key;
        const isActive = tabId === active;
        return (
          <button
            key={tabId}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => (onChange ? onChange(tabId) : t.onClick?.())}
            className={`inline-flex items-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              size === "sm" ? "h-7.5 px-3 text-xs" : "h-9 px-4 text-xs sm:text-[13px]"
            } ${
              isActive
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            } ${t.className ?? ""}`}
          >
            {t.icon ? <t.icon className="size-3.5" /> : null}
            {t.label}
            {t.count != null ? (
              <span
                className={`tabular rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
