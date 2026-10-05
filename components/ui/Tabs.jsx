"use client";

/**
 * Minimal tab strip. Uncontrolled when `value` is not supplied, controlled when
 * it is. Renders a sliding indicator for the active tab.
 */
export default function Tabs({ tabs, value, onChange, className = "", size = "md" }) {
  const active = value ?? tabs.find((t) => t.active)?.key;

  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-lg bg-slate-900/5 p-1 ${className}`}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => (onChange ? onChange(t.key) : t.onClick?.())}
            className={`inline-flex items-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none ${
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]"
            } ${
              isActive
                ? "bg-white text-slate-900 shadow-soft"
                : "text-slate-500 hover:text-slate-800"
            } ${t.className ?? ""}`}
          >
            {t.icon ? <t.icon className="size-3.5" /> : null}
            {t.label}
            {t.count != null ? (
              <span
                className={`tabular rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-brand-50 text-brand-700" : "bg-slate-900/8 text-slate-500"
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
