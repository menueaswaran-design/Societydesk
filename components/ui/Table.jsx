export default function Table({ head, children, className = "", minWidth = "min-w-[640px]", dense = false }) {
  const pad = dense ? "px-3.5 py-2.5" : "px-4.5 py-3.5";

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full ${minWidth} border-collapse text-left text-[13px]`}>
        <thead className="bg-slate-50/80 border-b border-slate-200/80">
          <tr>
            {head.map((h, i) => (
              <th
                key={h.key ?? i}
                scope="col"
                className={`text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap ${pad} ${
                  h.align === "right"
                    ? "text-right"
                    : h.align === "center"
                      ? "text-center"
                      : ""
                } ${h.className ?? ""}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = "", ...props }) {
  return (
    <tr className={`group transition-colors duration-150 hover:bg-slate-50/75 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function Td({ children, align = "left", colSpan, className = "", dense = false, ...props }) {
  const pad = dense ? "px-3.5 py-2.5" : "px-4.5 py-3.5";
  return (
    <td
      colSpan={colSpan}
      className={`${pad} align-middle text-slate-700 text-xs sm:text-[13px] leading-normal ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

/** Right-aligned cluster of row actions, used across every table. */
export function RowActions({ children }) {
  return (
    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">{children}</div>
  );
}
