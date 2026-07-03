import { ArrowRight, Shield } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="py-16 bg-bg-darkest relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 bg-blue-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/30">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
          Your Next Security Role{" "}
          <span className="gradient-text">Starts Here</span>
        </h2>

        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          Join 18,000+ cybersecurity professionals who&apos;ve found their dream jobs on Cykruit.
          It takes 5 minutes to set up your profile.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button href="/register" variant="primary" size="lg">
            Create Free Profile
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button href="/jobs" variant="secondary" size="lg">
            Browse Jobs First
          </Button>
        </div>
      </div>
    </section>
  );
}
