import HeroSection from "@/components/landing/HeroSection";
import FeaturedJobsSection from "@/components/landing/FeaturedJobsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ForEmployersSection from "@/components/landing/ForEmployersSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
<FeaturedJobsSection />
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
