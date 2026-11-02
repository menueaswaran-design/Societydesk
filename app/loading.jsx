export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top indeterminate micro-progress bar in Royal Cobalt */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-brand-500/15 overflow-hidden z-50">
        <div className="h-full w-full bg-gradient-to-r from-brand-600 via-[#5678EF] to-[#6995FF] animate-indeterminate" />
      </div>

      {/* Subtle radial ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-brand-500/6 blur-3xl animate-pulse" />

      {/* Smooth Modern Dual-Orbit Loader */}
      <div className="relative flex flex-col items-center justify-center gap-5">
        <div className="relative size-14">
          {/* Outer glowing track */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-brand-100" />

          {/* Primary clockwise gradient orbit */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-brand-600 border-r-brand-500 animate-spin [animation-duration:0.9s]" />

          {/* Inner counter-clockwise accent orbit */}
          <div className="absolute inset-2.5 rounded-full border-2 border-transparent border-b-[#6995FF] border-l-brand-600 animate-spin [animation-duration:1.4s] [animation-direction:reverse]" />

          {/* Center pulsating core jewel */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-2 rounded-full bg-brand-600 animate-ping opacity-75" />
          </div>
        </div>

        {/* Minimal frosted glass loading pill */}
        <div className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 shadow-xs border border-slate-200/70">
          <span className="size-1.5 rounded-full bg-brand-600 animate-pulse" />
          <span className="text-[12px] font-semibold text-slate-700 tracking-tight">Loading workspace...</span>
        </div>
      </div>
    </div>
  );
}
