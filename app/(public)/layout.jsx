import { Building2, CheckCircle2, Megaphone, Receipt, Wrench } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Receipt, title: "Maintenance billing", copy: "Fee rules, invoices, receipts and defaulter tracking in one place." },
  { icon: Wrench, title: "Complaint workflow", copy: "Raise, assign, resolve and confirm every issue with a full timeline." },
  { icon: Megaphone, title: "Notices that get read", copy: "Publish once and track how many residents have opened it." },
];

/**
 * Split layout for every unauthenticated screen: a brand panel on the left and
 * the form column on the right.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------------------------------- brand panel */}
      <section className="brand-canvas relative hidden overflow-hidden px-10 py-12 lg:flex lg:flex-col xl:px-16">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-white to-indigo-200 text-sm font-black tracking-tight text-brand-900 shadow-lg">
            SD
          </span>
          <div>
            <p className="text-base font-semibold text-white">SocietyDesk</p>
            <p className="text-[11px] tracking-wide text-white/45 uppercase">Society operations</p>
          </div>
        </div>

        <div className="mt-auto max-w-lg py-12">
          <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight text-white xl:text-[44px]">
            Retire the Excel sheet.
            <span className="mt-1 block bg-linear-to-r from-brand-200 via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
              Run the society properly.
            </span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            One workspace for maintenance billing, complaints and notices — built for Indian
            societies of 30 to 300 flats.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-100 ring-1 ring-white/15 backdrop-blur-sm">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-[12px] text-white/40">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-300" />
            Per-society data isolation
          </span>
          <span className="inline-flex items-center gap-2">
            <Building2 className="size-3.5 text-brand-200" />
            Built for RWA committees
          </span>
        </div>
      </section>

      {/* -------------------------------------------------------- form column */}
      <section className="flex flex-col bg-white">
        <div className="flex items-center gap-2.5 px-6 py-6 lg:hidden">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-accent-500 text-xs font-black text-white">
            SD
          </span>
          <p className="text-sm font-semibold text-slate-900">SocietyDesk</p>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </div>
  );
}
