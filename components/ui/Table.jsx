export default function Table({ head, children, className = "", dense = false }) {
  const pad = dense ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className={`scroll-fade-x overflow-x-auto ${className}`}>
      <table className="w-full min-w-full border-collapse text-left text-[14px]">
        <thead className="bg-slate-50/90">
          <tr className="border-b border-slate-200">
            {head.map((h, i) => (
              <th
                key={h.key ?? i}
                scope="col"
                className={`label-xs ${pad} ${
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
    <tr className={`transition-colors duration-100 hover:bg-slate-50/80 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function Td({ children, align = "left", colSpan, className = "", dense = false, ...props }) {
  const pad = dense ? "px-3 py-2" : "px-4 py-3";
  return (
    <td
      colSpan={colSpan}
      className={`${pad} align-middle text-slate-700 ${
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
    <div className="flex items-center justify-end gap-0.5">{children}</div>
  );
}
