import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { Home, Briefcase, Users, AlertCircle } from "lucide-react";

export default function EmployerNotFound() {
  return (
    <>
      <EmployerTopbar title="Not Found" />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
          </div>
          <p className="text-6xl font-black text-slate-100 leading-none font-mono select-none">404</p>
          <h1 className="text-lg font-bold text-slate-900 mt-2">Page not found</h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            This page doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
            >
              <Home className="w-4 h-4" /> Go to Dashboard
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              <Briefcase className="w-4 h-4" /> My Jobs
            </Link>
            <Link
              href="/employer/applicants"
              className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              <Users className="w-4 h-4" /> Applicants
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
