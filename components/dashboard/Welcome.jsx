import { cookies } from "next/headers";
import { getDictionary, resolveKey } from "@/lib/i18n";

/**
 * Welcome hero banner used at the top of every dashboard.
 * Styled with Bedy's signature Royal Cobalt gradient (#1E368D -> #3154D9 -> #6995FF).
 */
export default async function Welcome({ eyebrow, title, description, badge, actions, className = "" }) {
  let locale = "en";
  try {
    const cookieStore = await cookies();
    locale = cookieStore.get("sd_locale")?.value || "en";
  } catch {
    /* fallback */
  }
  const dict = getDictionary(locale);

  let localizedTitle = title;
  if (locale === "ta" && typeof title === "string" && dict) {
    if (title.startsWith("Good morning")) {
      localizedTitle = title.replace("Good morning", resolveKey(dict, "resident.goodMorning", "காலை வணக்கம்"));
    } else if (title.startsWith("Good afternoon")) {
      localizedTitle = title.replace("Good afternoon", resolveKey(dict, "resident.goodAfternoon", "மதிய வணக்கம்"));
    } else if (title.startsWith("Good evening")) {
      localizedTitle = title.replace("Good evening", resolveKey(dict, "resident.goodEvening", "மாலை வணக்கம்"));
    } else if (title.startsWith("Welcome back")) {
      localizedTitle = title.replace("Welcome back", resolveKey(dict, "resident.welcomeBack", "மீண்டும் வருக"));
    }
  }

  let localizedEyebrow = eyebrow;
  if (locale === "ta" && typeof eyebrow === "string") {
    if (eyebrow === "Resident portal") localizedEyebrow = "குடியிருப்பாளர் தளம்";
    else if (eyebrow === "Society overview" || eyebrow === "PG & Hostel Management") localizedEyebrow = "பிஜி மேலாண்மை தளம்";
  }

  let localizedDesc = description;
  if (locale === "ta" && description === "Pay society maintenance, track complaints, and stay updated with community notices.") {
    localizedDesc = "சமூக பராமரிப்புக் கட்டணம் செலுத்தவும், புகார்களை கண்காணிக்கவும், சமூக அறிவிப்புகளை உடனுக்குடன் பெறவும்.";
  }

  return (
    <section
      className={`animate-rise relative overflow-hidden rounded-2xl bg-gradient-brand px-6 py-6 sm:px-7 sm:py-7 text-white shadow-md border border-brand-400/20 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-white/15 blur-3xl"
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          {localizedEyebrow ? (
            <p className="mb-1.5 text-[11px] font-bold tracking-wider text-brand-200 uppercase">
              {localizedEyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {localizedTitle}
          </h1>
          {localizedDesc ? (
            <p className="mt-1 max-w-xl text-xs sm:text-[13px] leading-relaxed text-brand-100/95 font-medium">
              {localizedDesc}
            </p>
          ) : null}
        </div>

        {badge || actions ? (
          <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
            {badge ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-xs">
                {badge}
              </span>
            ) : null}
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
