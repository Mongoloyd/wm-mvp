import { useState } from "react";
import { WarmIntentProvider } from "@/hooks/useWarmIntent";
import CinematicBackdrop from "@/components/contractors/CinematicBackdrop";
import HeroSection from "@/components/contractors/HeroSection";
import ProblemSection from "@/components/contractors/ProblemSection";
import MarketRealitySection from "@/components/contractors/MarketRealitySection";
import InsightSection from "@/components/contractors/InsightSection";
import SolutionSection from "@/components/contractors/SolutionSection";
import HowItWorksSection from "@/components/contractors/HowItWorksSection";
import ROISection from "@/components/contractors/ROISection";
import BusinessModelSection from "@/components/contractors/BusinessModelSection";
import DefensibilitySection from "@/components/contractors/DefensibilitySection";
import FinalCTASection from "@/components/contractors/FinalCTASection";
import CTAFloatPill from "@/components/contractors/CTAFloatPill";
import QualificationFlow from "@/components/contractors/QualificationFlow";
import { AnimatePresence } from "framer-motion";

const Contractors = () => {
  const [showQualification, setShowQualification] = useState(false);

  const openQualification = () => setShowQualification(true);
  const closeQualification = () => setShowQualification(false);

  return (
    <WarmIntentProvider>
      <div className="contractors-page">
        <main className="relative min-h-screen overflow-x-hidden">
          <CinematicBackdrop />

          <div className="relative z-10">
            <HeroSection onSeeHowItWorks={openQualification} />
            <ProblemSection />
            <MarketRealitySection />
            <InsightSection />
            <SolutionSection />
            <HowItWorksSection />
            <ROISection />
            <BusinessModelSection />
            <DefensibilitySection />
            <FinalCTASection onRequestAccess={openQualification} />
          </div>

          <CTAFloatPill onRequestAccess={openQualification} />

          <AnimatePresence>
            {showQualification && (
              <QualificationFlow
                isOpen={showQualification}
                onClose={closeQualification}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </WarmIntentProvider>
  );
};

export default Contractors;