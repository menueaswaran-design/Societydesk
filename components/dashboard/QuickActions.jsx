import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cookies } from "next/headers";
import { getDictionary, resolveKey } from "@/lib/i18n";

const TONES = {
  brand: {
    chip: "bg-brand-50 text-brand-700 ring-1 ring-brand-600/20",
    value: "text-slate-900",
    caption: "text-slate-500",
  },
  green: {
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    value: "text-emerald-700",
    caption: "text-emerald-700",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    value: "text-amber-700",
    caption: "text-amber-800",
  },
  red: {
    chip: "bg-rose-50 text-rose-600 ring-1 ring-rose-600/20",
    value: "text-rose-600",
    caption: "text-rose-700",
  },
  sky: {
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    value: "text-slate-900",
    caption: "text-slate-500",
  },
  violet: {
    chip: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
    value: "text-slate-900",
    caption: "text-slate-500",
  },
};

const TITLE_TRANSLATIONS = {
  "Pay maintenance": "resident.payMaintenance",
  "Raise a complaint": "resident.raiseComplaint",
  "Notice board": "nav.notices",
  "Payment receipts": "nav.paymentReceipts",
  "Add resident": "nav.residents",
  "Issue notice": "nav.notices",
  "Generate invoice": "nav.invoices",
};

const BADGE_TRANSLATIONS = {
  "Pay now": "common.payNow",
  "Clear": "common.clear",
};

/**
 * Large touch-friendly shortcut tiles.
 * Server component accepting icon references safely without RSC serialization issues.
 */
export async function QuickActions({ items, className = "" }) {
  if (!items || items.length === 0) return null;
  let locale = "en";
  try {
    const cookieStore = await cookies();
    locale = cookieStore.get("sd_locale")?.value || "en";
  } catch {
    /* fallback to default */
  }
  const dict = getDictionary(locale);

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <QuickAction key={item.href} {...item} locale={locale} dict={dict} />
      ))}
    </div>
  );
}

export function QuickAction({ href, icon: Icon, title, value, caption, tone = "brand", badge, locale = "en", dict }) {
  const toneCfg = TONES[tone] || TONES.brand;

  let localizedTitle = title;
  if (locale === "ta" && TITLE_TRANSLATIONS[title] && dict) {
    localizedTitle = resolveKey(dict, TITLE_TRANSLATIONS[title], title);
  }

  let localizedBadge = badge;
  if (locale === "ta" && BADGE_TRANSLATIONS[badge] && dict) {
    localizedBadge = resolveKey(dict, BADGE_TRANSLATIONS[badge], badge);
  }

  let localizedCaption = caption;
  if (locale === "ta" && typeof caption === "string" && dict) {
    if (caption === "All dues are cleared") {
      localizedCaption = resolveKey(dict, "resident.allDuesCleared", "அனைத்து நிலுவைகளும் செலுத்தப்பட்டுவிட்டன");
    } else if (caption.endsWith("payable")) {
      localizedCaption = caption.replace("payable", resolveKey(dict, "resident.payable", "செலுத்த வேண்டியது"));
    }
  }

  // Derive metric value if not explicitly passed
  let displayValue = value;
  let bottomCaption = localizedCaption;
  if (displayValue === undefined || displayValue === null) {
    if (typeof caption === "string") {
      const match = caption.match(/(₹[\d,]+)/);
      if (match) {
        displayValue = match[1];
        bottomCaption = localizedCaption.replace(match[1], "").trim() || "Payment pending";
      } else {
        displayValue = localizedCaption;
        bottomCaption = localizedTitle;
      }
    } else {
      displayValue = localizedTitle;
    }
  }

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-300"
    >
      {/* Top Row: Heading (Left) & Icon Badge (Right) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate"
          title={localizedTitle}
        >
          {localizedTitle}
        </span>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 [&_svg]:size-4 ${toneCfg.chip}`}
        >
          {Icon ? <Icon /> : null}
        </span>
      </div>

      {/* Middle: Prominent Metric / Value */}
      <div className="mt-2 min-w-0">
        <p
          className={`text-2xl sm:text-[28px] font-extrabold tracking-tight tabular-nums truncate ${toneCfg.value}`}
          title={String(displayValue ?? "")}
        >
          {displayValue}
        </p>
      </div>

      {/* Bottom Row: Caption (Left) & Arrow Up Right (Right) */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
        <span
          className={`truncate font-semibold ${toneCfg.caption}`}
          title={bottomCaption}
        >
          {bottomCaption}
        </span>
        <ArrowUpRight className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

export default QuickActions;