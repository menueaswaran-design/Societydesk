/**
 * Page title block. Every screen uses this so headings, descriptions and the
 * primary action stay aligned across roles.
 */
export default function PageHeader({ title, description, actions, meta, className = "" }) {
  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[28px] leading-tight font-semibold text-slate-900 sm:text-[32px]">
            {title}
          </h1>
          {meta}
        </div>
        {description ? (
          <p className="mt-1 text-[14px] text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
