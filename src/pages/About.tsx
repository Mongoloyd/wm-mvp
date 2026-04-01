import { useEffect } from "react";
import { trackEvent } from "@/lib/trackEvent";
import AboutHeader from "@/components/about/AboutHeader";
import AboutHero from "@/components/about/AboutHero";
import MarketProblemSection from "@/components/about/MarketProblemSection";
import InformationAsymmetrySection from "@/components/about/InformationAsymmetrySection";
import WhyPricesVarySection from "@/components/about/WhyPricesVarySection";
import NotAContractorSection from "@/components/about/NotAContractorSection";
import HowWindowManWorksSection from "@/components/about/HowWindowManWorksSection";
import ArbitrageEngineSection from "@/components/about/ArbitrageEngineSection";
import HowWeMakeMoneySection from "@/components/about/HowWeMakeMoneySection";
import BestPriceConditionsSection from "@/components/about/BestPriceConditionsSection";
import TransparencyShiftSection from "@/components/about/TransparencyShiftSection";
import ContractorBenefitSection from "@/components/about/ContractorBenefitSection";
import InevitabilitySection from "@/components/about/InevitabilitySection";
import TrustProofSection from "@/components/about/TrustProofSection";
import AboutCTASection from "@/components/about/AboutCTASection";
import AboutFooter from "@/components/about/AboutFooter";

export default function About() {
  useEffect(() => {
    trackEvent({
      event_name: "about_page_opened",
      route: "/about"
    });
  }, []);

  const handleTrack = (eventName: string) => {
    trackEvent({
      event_name: eventName,
      route: "/about"
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(170deg, #dce8f4 0%, #e4edf6 30%, #eaeff8 60%, #dde6f2 100%)" }}>
      <AboutHeader />
      <AboutHero onTrack={handleTrack} />
      <MarketProblemSection />
      <InformationAsymmetrySection onTrack={handleTrack} />
      <WhyPricesVarySection />
      <NotAContractorSection />
      <HowWindowManWorksSection />
      <ArbitrageEngineSection />
      <HowWeMakeMoneySection />
      <BestPriceConditionsSection />
      <TransparencyShiftSection />
      <ContractorBenefitSection />
      <InevitabilitySection />
      <TrustProofSection />
      <AboutCTASection onTrack={handleTrack} />
      <AboutFooter />
    </main>
  );
}
