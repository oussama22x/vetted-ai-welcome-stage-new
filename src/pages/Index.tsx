import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhyItMattersSection } from "@/components/landing/WhyItMattersSection";
import { PerformanceGraphSection } from "@/components/landing/PerformanceGraphSection";
import { ProductSection } from "@/components/landing/ProductSection";
import { FoundersNoteSection } from "@/components/landing/FoundersNoteSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <HeroSection />
      <WhyItMattersSection />
      <PerformanceGraphSection />
      <ProductSection />
      <FoundersNoteSection />
      <FinalCtaSection />
      <Footer />
    </div>
  );
};

export default Index;
