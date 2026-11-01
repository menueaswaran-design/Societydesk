export default function PublicLoading() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center p-6">
      <div className="relative size-9">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200/80" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-600 border-r-brand-500 animate-spin" />
      </div>
    </div>
  );
}
