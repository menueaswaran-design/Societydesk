import { initials } from "@/lib/format";

const SIZES = {
  xs: "size-7 text-[10px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

const TONES = {
  brand: "bg-linear-to-br from-brand-500 to-accent-600 text-white",
  slate: "bg-linear-to-br from-slate-500 to-slate-700 text-white",
  emerald: "bg-linear-to-br from-emerald-400 to-emerald-600 text-white",
  amber: "bg-linear-to-br from-amber-400 to-orange-500 text-white",
};

/** Initials avatar with a deterministic tone so the same person always looks the same. */
export default function Avatar({
  name,
  size = "md",
  tone,
  className = "",
  ring = false,
}) {
  const resolved = tone ?? TONES[Math.abs(hash(name ?? "")) % Object.keys(TONES).length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none ${SIZES[size] ?? SIZES.md} ${
        ring ? "ring-2 ring-white/70" : ""
      } ${resolved} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

function hash(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export { SIZES as AVATAR_SIZES, TONES as AVATAR_TONES };
