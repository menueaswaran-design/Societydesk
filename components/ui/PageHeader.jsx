/**
 * Page title block. Every screen uses this so headings, descriptions and the
 * primary action stay aligned across roles.
 */
export default function PageHeader({ title, description, actions, meta, className = "" }) {
  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-x-6 sm:gap-y-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {meta}
        </div>
        {description ? (
          <p className="mt-1 text-xs sm:text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full sm:w-auto shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
