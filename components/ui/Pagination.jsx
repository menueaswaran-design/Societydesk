"use client";

import { useMemo } from "react";
import { DropdownSelect } from "@/components/ui/Dropdown";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/**
 * Calculates page numbers with smart ellipsis windowing
 */
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  let left = Math.max(2, currentPage - 1);
  let right = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 3) {
    left = 2;
    right = 4;
  } else if (currentPage >= totalPages - 2) {
    left = totalPages - 3;
    right = totalPages - 1;
  }

  if (left > 2) {
    pages.push("...");
  }

  for (let i = left; i <= right; i++) {
    pages.push(i);
  }

  if (right < totalPages - 1) {
    pages.push("...");
  }

  pages.push(totalPages);
  return pages;
}

/**
 * Modern Bedy Pagination Component
 *
 * @param {number} page - Current active page (1-based)
 * @param {number} pageSize - Number of items per page
 * @param {number} totalItems - Total count of items across all pages
 * @param {function} onPageChange - Callback when page changes (newPage: number)
 * @param {function} [onPageSizeChange] - Callback when page size changes (newSize: number)
 * @param {number[]} [pageSizeOptions] - List of page size options (e.g. [10, 20, 50])
 * @param {string} [itemName] - Name of items being paginated (default: "items")
 * @param {boolean} [showRange] - Whether to show the range text (default: false)
 * @param {string} [className] - Optional extra wrapper class
 */
export default function Pagination({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = "items",
  showRange = false,
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 border-t border-neutral-100 bg-white select-none ${className}`}
    >
      {/* Left: Per Page Selector (Single Line) */}
      <div className="flex items-center gap-3 text-xs text-neutral-500 min-w-0">
        {showRange && (
          <div className="whitespace-nowrap">
            Showing{" "}
            <span className="font-extrabold text-neutral-900 tabular-nums">
              {startItem}
            </span>{" "}
            to{" "}
            <span className="font-extrabold text-neutral-900 tabular-nums">
              {endItem}
            </span>{" "}
            of{" "}
            <span className="font-extrabold text-neutral-900 tabular-nums">
              {totalItems}
            </span>{" "}
            {itemName}
          </div>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-neutral-600 shrink-0">
            <span className="font-medium whitespace-nowrap">Per page:</span>
            <DropdownSelect
              size="sm"
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="w-20 shrink-0"
              options={pageSizeOptions.map((opt) => ({
                value: String(opt),
                label: String(opt),
              }))}
            />
          </div>
        )}
      </div>

      {/* Right: Page Buttons & Chevrons */}
      <nav
        aria-label="Pagination"
        className="flex items-center gap-1 self-center sm:self-auto"
      >
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First page"
          aria-label="First page"
          className="hidden sm:inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronsLeft className="size-3.5" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
          aria-label="Previous page"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs font-bold text-neutral-400 pointer-events-none"
                >
                  •••
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isActive ? "page" : undefined}
                className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all tabular-nums ${
                  isActive
                    ? "bg-brand-600 text-white shadow-2xs hover:bg-brand-700"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next page"
          aria-label="Next page"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last page"
          aria-label="Last page"
          className="hidden sm:inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronsRight className="size-3.5" />
        </button>
      </nav>
    </div>
  );
}

