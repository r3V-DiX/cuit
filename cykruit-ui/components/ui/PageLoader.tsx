"use client";

import { Shield } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        {/* Inner icon */}
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-sm font-semibold text-white tracking-wide">Cykruit</span>
        <span className="text-xs text-slate-500 font-mono animate-pulse">Loading...</span>
      </div>
    </div>
  );
}
