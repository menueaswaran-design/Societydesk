export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Top indeterminate loading bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden z-50">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-progress" />
      </div>

      <div className="w-full max-w-xs flex flex-col items-center space-y-4">
        {/* Modern Bedy Brand Logo with pulse glow */}
        <div className="relative">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20">
            B
          </div>
          <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
        </div>

        <div className="text-center space-y-1 pt-1">
          <p className="text-sm font-bold text-white tracking-tight">Bedy</p>
          <p className="text-xs text-slate-400">Loading your workspace...</p>
        </div>

        {/* Smooth loading dots */}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-indigo-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
