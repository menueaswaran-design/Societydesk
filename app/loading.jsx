export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Top indeterminate loading bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden z-50">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-progress" />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-4 animate-pulse">
        <div className="size-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl shadow-sm">
          SD
        </div>
        <div className="h-4 w-32 rounded-full bg-slate-200" />
        <div className="h-3 w-48 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

