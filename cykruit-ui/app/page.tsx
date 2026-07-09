import HeroSection from "@/components/landing/HeroSection";
import FeaturedJobsSection, { FeaturedJob } from "@/components/landing/FeaturedJobsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ForEmployersSection from "@/components/landing/ForEmployersSection";
import TestimonialsSection, { Testimonial } from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PUBLIC_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";

function trimDescription(desc?: string): string {
  if (!desc) return "";
  const introEnd = desc.search(/\n\n(responsibilities|requirements):/i);
  return (introEnd > 0 ? desc.slice(0, introEnd) : desc).trim();
}

async function getFeaturedJobs(): Promise<FeaturedJob[]> {
  try {
    const res = await fetch(`${PUBLIC_URL}/public/jobs?limit=6`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = await res.json();
    const raw = body?.data;
    const jobs: FeaturedJob[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return jobs.map((j) => ({ ...j, description: trimDescription((j as any).description) }));
  } catch {
    return [];
  }
}

async function getSeekerTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${PUBLIC_URL}/public/testimonials?type=SEEKER`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const raw = body?.data;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const [jobs, seekerTestimonials] = await Promise.all([
    getFeaturedJobs(),
    getSeekerTestimonials(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturedJobsSection jobs={jobs} />
        <HowItWorksSection />
        <FeaturesSection />
        <ForEmployersSection />
        <TestimonialsSection testimonials={seekerTestimonials} />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
