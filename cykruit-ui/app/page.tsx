import HeroSection from "@/components/landing/HeroSection";
import FeaturedJobsSection, { FeaturedJob } from "@/components/landing/FeaturedJobsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ForEmployersSection from "@/components/landing/ForEmployersSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

async function getFeaturedJobs(): Promise<FeaturedJob[]> {
  try {
    const PUBLIC_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";
    const res = await fetch(`${PUBLIC_URL}/public/jobs?limit=6`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    // ResponseInterceptor wraps to { success, data: <service return>, meta }
    // Jobs service returns { data: [...], total, ... } so final path is body.data.data
    const raw = body?.data;
    const jobs = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return jobs;
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const jobs = await getFeaturedJobs();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturedJobsSection jobs={jobs} />
        <HowItWorksSection />
        <FeaturesSection />
        <ForEmployersSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
