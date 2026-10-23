import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cookies } from "next/headers";
import { getDictionary, resolveKey } from "@/lib/i18n";

const TONES = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
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

export function QuickAction({ href, icon: Icon, title, caption, tone = "brand", badge, locale = "en", dict }) {
  const tTone = TONES[tone] ?? TONES.brand;

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

  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-300"
    >
      <span
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 [&_svg]:size-5 transition-transform duration-200 group-hover:scale-105 ${tTone}`}
      >
        {Icon ? <Icon /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold text-slate-900 leading-tight">
            {localizedTitle}
          </span>
          {localizedBadge ? (
            <span className="shrink-0">
              <Badge tone="brand" className="text-[10px] px-1.5 py-0.2">{localizedBadge}</Badge>
            </span>
          ) : null}
        </span>
        {localizedCaption ? (
          <span className="mt-0.5 block text-xs text-slate-500 font-medium leading-normal">
            {localizedCaption}
          </span>
        ) : null}
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-slate-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </Link>
  );
}

export default QuickActions;