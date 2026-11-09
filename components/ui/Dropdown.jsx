"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useId,
  useCallback,
} from "react";
import { ChevronDown, Check } from "lucide-react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Helper to get bounding limits of enclosing modal dialog, scroll container, or viewport.
 */
function getContainerLimits(element) {
  if (!element || typeof window === "undefined") {
    return {
      top: 0,
      bottom: typeof window !== "undefined" ? window.innerHeight : 800,
    };
  }

  // Find enclosing modal dialog, scroll container, or card
  const scrollContainer =
    element.closest('[role="dialog"]') ||
    element.closest(".overflow-y-auto") ||
    element.closest(".modal-body") ||
    element.closest(".card-body");

  if (scrollContainer) {
    const rect = scrollContainer.getBoundingClientRect();
    return {
      top: Math.max(0, rect.top),
      bottom: Math.min(window.innerHeight, rect.bottom),
    };
  }

  return {
    top: 0,
    bottom: window.innerHeight,
  };
}

/* ==========================================================================
   1. ACTION DROPDOWN MENU
   ========================================================================== */

const DropdownContext = createContext(null);

export function Dropdown({
  trigger,
  items,
  children,
  align = "left",
  width = "w-48",
  className = "",
  menuClassName = "",
  isOpen: controlledIsOpen,
  onOpenChange,
}) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const containerRef = useRef(null);

  const toggle = (next) => {
    const nextVal = next !== undefined ? next : !isOpen;
    if (!isControlled) {
      setUncontrolledIsOpen(nextVal);
    }
    onOpenChange?.(nextVal);
  };

  const close = () => toggle(false);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        close();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close, align, width, containerRef }}>
      <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
        {/* Simple props-based API */}
        {trigger ? (
          typeof trigger === "string" ? (
            <button
              type="button"
              onClick={() => toggle()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/90 text-neutral-800 text-xs font-semibold px-3 py-1.5 shadow-2xs transition active:scale-98 cursor-pointer focus:outline-none"
            >
              <span>{trigger}</span>
            </button>
          ) : (
            <div onClick={() => toggle()} className="cursor-pointer">
              {trigger}
            </div>
          )
        ) : null}

        {/* Props-based items menu */}
        {items && isOpen && (
          <DropdownMenu align={align} width={width} className={menuClassName}>
            {items.map((item, idx) => {
              if (item.divider) {
                return <DropdownDivider key={`divider-${idx}`} />;
              }
              return (
                <DropdownItem
                  key={item.label || idx}
                  onClick={(e) => {
                    item.onClick?.(e);
                    close();
                  }}
                  disabled={item.disabled}
                  danger={item.danger}
                  icon={item.icon}
                >
                  {item.label}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        )}

        {/* Composable children API */}
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({ children, className = "" }) {
  const { toggle, isOpen } = useContext(DropdownContext);

  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        toggle();
      },
      "aria-haspopup": "menu",
      "aria-expanded": isOpen,
    });
  }

  return (
    <button
      type="button"
      onClick={() => toggle()}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/90 text-neutral-800 text-xs font-semibold px-3 py-1.5 shadow-2xs transition active:scale-98 cursor-pointer focus:outline-none ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenu({ children, align, width, className = "" }) {
  const ctx = useContext(DropdownContext);
  const actualAlign = align ?? ctx?.align ?? "left";
  const actualWidth = width ?? ctx?.width ?? "w-48";
  const containerRef = ctx?.containerRef;

  const [placement, setPlacement] = useState({
    dropUp: false,
    alignRight: actualAlign === "right",
    maxHeight: 280,
  });

  const updateMenuPlacement = useCallback(() => {
    if (!containerRef?.current) return;
    const triggerRect = containerRef.current.getBoundingClientRect();
    const limits = getContainerLimits(containerRef.current);

    const spaceBelow = limits.bottom - triggerRect.bottom - 10;
    const spaceAbove = triggerRect.top - limits.top - 10;

    // Flip up if space below < 180 and above has more room
    const shouldDropUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const available = shouldDropUp ? spaceAbove : spaceBelow;
    const computedMax = Math.max(130, Math.min(300, Math.floor(available)));

    const spaceRight = window.innerWidth - triggerRect.left;
    const shouldAlignRight = actualAlign === "right" || spaceRight < 200;

    setPlacement({
      dropUp: shouldDropUp,
      alignRight: shouldAlignRight,
      maxHeight: computedMax,
    });
  }, [containerRef, actualAlign]);

  useIsomorphicLayoutEffect(() => {
    updateMenuPlacement();
  }, [updateMenuPlacement]);

  useEffect(() => {
    window.addEventListener("resize", updateMenuPlacement);
    window.addEventListener("scroll", updateMenuPlacement, true);
    return () => {
      window.removeEventListener("resize", updateMenuPlacement);
      window.removeEventListener("scroll", updateMenuPlacement, true);
    };
  }, [updateMenuPlacement]);

  return (
    <div
      role="menu"
      className={`absolute z-50 ${actualWidth} rounded-xl border border-neutral-200/90 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-pop select-none ${
        placement.dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
      } ${placement.alignRight ? "right-0" : "left-0"} ${className}`}
    >
      <div
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ maxHeight: `${placement.maxHeight}px` }}
        className="overflow-y-auto overscroll-contain [scrollbar-width:thin] space-y-0.5"
      >
        {children}
      </div>
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  danger = false,
  icon: Icon,
  className = "",
}) {
  const ctx = useContext(DropdownContext);

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        ctx?.close?.();
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-[13px] font-medium rounded-lg transition-colors text-left cursor-pointer ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : danger
          ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
      } ${className}`}
    >
      {Icon && (
        <span className="shrink-0 text-neutral-400 [&_svg]:size-4">
          {typeof Icon === "function" ? <Icon className="size-4" /> : Icon}
        </span>
      )}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
}

export function DropdownDivider({ className = "" }) {
  return <div className={`my-1 border-t border-neutral-100 ${className}`} />;
}

/* ==========================================================================
   2. CUSTOM SELECT DROPDOWN (Matches original screenshot)
   ========================================================================== */

function extractOptions(children, options) {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((opt) =>
      typeof opt === "string"
        ? { value: opt, label: opt }
        : {
            value: opt.value ?? opt.id,
            label: opt.label ?? opt.name ?? String(opt.value),
            icon: opt.icon,
            disabled: opt.disabled,
          }
    );
  }

  const result = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === "option") {
      result.push({
        value: child.props.value !== undefined ? String(child.props.value) : "",
        label: child.props.children || child.props.value,
        disabled: child.props.disabled,
      });
    } else if (child.type === "optgroup") {
      result.push({
        isGroup: true,
        label: child.props.label,
      });
      React.Children.forEach(child.props.children, (optChild) => {
        if (React.isValidElement(optChild) && optChild.type === "option") {
          result.push({
            value: optChild.props.value !== undefined ? String(optChild.props.value) : "",
            label: optChild.props.children || optChild.props.value,
            disabled: optChild.props.disabled,
          });
        }
      });
    }
  });

  return result;
}

export function DropdownSelect({
  value,
  defaultValue,
  onChange,
  options,
  children,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  className = "",
  inputClassName = "",
  menuClassName = "",
  id,
  name,
  required = false,
  align = "left",
  size = "md", // "sm" | "md" | "lg"
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value ?? "") : uncontrolledValue;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const [placement, setPlacement] = useState({
    dropUp: false,
    alignRight: align === "right",
    maxHeight: 220,
  });

  const parsedOptions = React.useMemo(
    () => extractOptions(children, options),
    [children, options]
  );

  const selectedOption = parsedOptions.find(
    (opt) => !opt.isGroup && String(opt.value) === currentValue
  );

  // Dynamic collision detection and placement calculation
  const updateSelectPlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const limits = getContainerLimits(triggerRef.current);

    const spaceBelow = limits.bottom - triggerRect.bottom - 10;
    const spaceAbove = triggerRect.top - limits.top - 10;

    // A full dropdown with 6-7 items is ~240px.
    // If at least ~75% (>= 180px) is visible below, drop down; otherwise flip up if space above is greater!
    const shouldDropUp = spaceBelow < 185 && spaceAbove > spaceBelow;
    const available = shouldDropUp ? spaceAbove : spaceBelow;
    const computedMax = Math.max(130, Math.min(260, Math.floor(available)));

    const spaceRight = window.innerWidth - triggerRect.left;
    const shouldAlignRight = align === "right" || spaceRight < 220;

    setPlacement({
      dropUp: shouldDropUp,
      alignRight: shouldAlignRight,
      maxHeight: computedMax,
    });
  }, [align]);

  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      updateSelectPlacement();
    }
  }, [isOpen, updateSelectPlacement]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updateSelectPlacement);
    window.addEventListener("scroll", updateSelectPlacement, true);
    return () => {
      window.removeEventListener("resize", updateSelectPlacement);
      window.removeEventListener("scroll", updateSelectPlacement, true);
    };
  }, [isOpen, updateSelectPlacement]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    setIsOpen(false);

    // Call onChange with synthetic event to be 100% compatible with existing forms
    if (onChange) {
      const syntheticEvent = {
        target: {
          value: val,
          name: name || selectId,
          id: selectId,
        },
        currentTarget: {
          value: val,
          name: name || selectId,
          id: selectId,
        },
        value: val,
      };
      onChange(syntheticEvent);
    }

    triggerRef.current?.focus();
  };

  const sizeClasses = {
    sm: "h-7.5 px-2.5 text-xs rounded-lg",
    md: "h-9.5 px-3 text-[13px] rounded-xl",
    lg: "h-11 px-3.5 text-sm rounded-xl",
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      {/* Hidden input to ensure form submissions work */}
      <input
        type="hidden"
        id={selectId}
        name={name || selectId}
        value={currentValue}
        required={required}
      />

      {/* Custom Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId ? `${selectId}-trigger` : undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            updateSelectPlacement();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full bg-white text-neutral-900 border transition-all duration-150 flex items-center justify-between gap-2 shadow-2xs text-left cursor-pointer focus:outline-none ${
          sizeClasses[size] || sizeClasses.md
        } ${
          error
            ? "border-error-500 focus:ring-3 focus:ring-error-400/20"
            : isOpen
            ? "border-brand-600 ring-3 ring-brand-200"
            : "border-[#D2D9E6] hover:border-neutral-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-200"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-neutral-50" : ""} ${inputClassName}`}
      >
        <span
          className={`truncate flex-1 ${
            !selectedOption || selectedOption.value === ""
              ? "text-neutral-400 font-normal"
              : "text-neutral-900 font-semibold"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-600" : ""
          }`}
        />
      </button>

      {/* Custom Floating Popover Menu (Matches Dropdown UI) */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 min-w-full w-max max-w-sm rounded-xl border border-neutral-200/90 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-pop overflow-hidden ${
            placement.dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${placement.alignRight ? "right-0" : "left-0"} ${menuClassName}`}
        >
          <div
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ maxHeight: `${placement.maxHeight}px` }}
            className="overflow-y-auto overscroll-contain [scrollbar-width:thin] space-y-0.5"
          >
            {parsedOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-400 text-center">
                No options available
              </div>
            ) : (
              parsedOptions.map((opt, idx) => {
                if (opt.isGroup) {
                  return (
                    <div
                      key={`group-${idx}`}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
                    >
                      {opt.label}
                    </div>
                  );
                }

                const isSelected = String(opt.value) === currentValue;

                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-[13px] rounded-lg transition-all text-left cursor-pointer ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-brand-50 text-brand-700 font-bold"
                        : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-brand-600 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dropdown;
