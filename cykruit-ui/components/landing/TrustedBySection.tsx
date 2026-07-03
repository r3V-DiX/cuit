const companies = [
  { name: "CrowdStrike", abbr: "CS", color: "text-red-400" },
  { name: "Palo Alto Networks", abbr: "PAN", color: "text-orange-400" },
  { name: "Mandiant", abbr: "MDT", color: "text-blue-400" },
  { name: "Okta", abbr: "OKTA", color: "text-cyan-400" },
  { name: "Recorded Future", abbr: "RF", color: "text-purple-400" },
  { name: "Tenable", abbr: "TENB", color: "text-green-400" },
  { name: "SentinelOne", abbr: "S1", color: "text-indigo-400" },
];

export default function TrustedBySection() {
  return (
    <section className="py-12 bg-bg-darkest border-y border-blue-900/30 relative overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/30 to-transparent scan-right pointer-events-none" />

      {/* Glow lines top/bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />

      {/* Corner brackets */}
      <div className="absolute top-3 left-4 w-4 h-4 border-t border-l border-blue-500/30 pointer-events-none" />
      <div className="absolute top-3 right-4 w-4 h-4 border-t border-r border-blue-500/30 pointer-events-none" />
      <div className="absolute bottom-3 left-4 w-4 h-4 border-b border-l border-blue-500/30 pointer-events-none" />
      <div className="absolute bottom-3 right-4 w-4 h-4 border-b border-r border-blue-500/30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[10px] font-mono text-blue-400/50 uppercase tracking-[0.3em] mb-8">
          [ TRUSTED BY SECURITY TEAMS AT ]
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-5">
          {companies.map(({ name, abbr, color }, i) => (
            <div key={name} className="flex items-center gap-2 opacity-40 hover:opacity-90 transition-all duration-200 cursor-default group">
              {/* Node dot */}
              {i > 0 && (
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-blue-500/30 mx-1" />
              )}
              <span className={`text-sm font-bold font-mono ${color} group-hover:drop-shadow-[0_0_6px_currentColor] transition-all`}>{abbr}</span>
              <span className="text-sm font-medium text-slate-400 tracking-tight">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
