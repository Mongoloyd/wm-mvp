import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import HeroSection from "@/components/sections/HeroSection";
import MarketTruthSection from "@/components/sections/MarketTruthSection";
import CompetitorQuoteSection from "@/components/sections/CompetitorQuoteSection";
import BuyerReadinessSection from "@/components/sections/BuyerReadinessSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import EconomicsSection from "@/components/sections/EconomicsSection";
import FlywheelSection from "@/components/sections/FlywheelSection";
import DifferentiationSection from "@/components/sections/DifferentiationSection";
import ExclusivitySection from "@/components/sections/ExclusivitySection";
import VideoSection from "@/components/sections/VideoSection";
import BookingSection from "@/components/sections/BookingSection";
import QualificationStripSection from "@/components/sections/QualificationStripSection";
import FAQSection from "@/components/sections/FAQSection";
import QualificationFlow from "@/components/qualification/QualificationFlow";

const Contractors2 = () => {
  const [qualOpen, setQualOpen] = useState(false);

  return (
    <PageWrapper>
      <HeroSection />
      <MarketTruthSection />
      <CompetitorQuoteSection />
      <BuyerReadinessSection />
      <HowItWorksSection />
      <EconomicsSection />
      <DifferentiationSection />
      <ExclusivitySection />
      <VideoSection />
      <BookingSection />
      <QualificationStripSection onOpenQualification={() => setQualOpen(true)} />
      <FAQSection />
      <QualificationFlow isOpen={qualOpen} onClose={() => setQualOpen(false)} />
    </PageWrapper>
  );
};

export default Contractors2;
