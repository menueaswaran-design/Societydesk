import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="surface p-8 max-w-md w-full space-y-4">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold text-xl ring-1 ring-brand-200">
          404
        </span>
        <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
        <p className="text-xs text-slate-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}

