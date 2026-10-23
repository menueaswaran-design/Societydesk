"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

/**
 * Toolbar search field. Clears with one click and keeps its own draft state so
 * the surrounding list can filter on every keystroke.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  autoFocus = false,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors ${focused ? "text-emerald-600" : "text-slate-400"}`}
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9.5 w-full rounded-xl bg-white pr-9 pl-9 text-xs sm:text-[13px] text-slate-900 border border-slate-200/90 shadow-2xs transition-all duration-150 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
