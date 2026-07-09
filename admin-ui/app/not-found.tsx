import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <p className="font-mono text-xs uppercase tracking-widest text-blue-500 mb-3">404 — not found</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">This page doesn&apos;t exist</h1>
      <p className="text-sm text-slate-500 mb-6">The page you&apos;re looking for isn&apos;t part of the admin console.</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-md shadow-blue-500/20 transition-all"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
