import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/trackEvent";
import AboutHero from "@/components/about/AboutHero";
import MarketProblemSection from "@/components/about/MarketProblemSection";
import InformationAsymmetrySection from "@/components/about/InformationAsymmetrySection";
import WhyPricesVarySection from "@/components/about/WhyPricesVarySection";
import NotAContractorSection from "@/components/about/NotAContractorSection";
import HowWindowManWorksSection from "@/components/about/HowWindowManWorksSection";
import ArbitrageEngineSection from "@/components/about/ArbitrageEngineSection";
import ArbitrageEngine from "@/components/arbitrageengine";
import HowWeMakeMoneySection from "@/components/about/HowWeMakeMoneySection";
import BestPriceConditionsSection from "@/components/about/BestPriceConditionsSection";
import TransparencyShiftSection from "@/components/about/TransparencyShiftSection";
import ContractorBenefitSection from "@/components/about/ContractorBenefitSection";
import InevitabilitySection from "@/components/about/InevitabilitySection";
import TrustProofSection from "@/components/about/TrustProofSection";
import AboutCTASection from "@/components/about/AboutCTASection";
import AboutFooter from "@/components/about/AboutFooter";

type FunnelStep =
  | "scope"
  | "intent_filter"
  | "status"
  | "comp_a"
  | "comp_b"
  | "contact"
  | "identity"
  | "intent"
  | "call"
  | "timeframe"
  | "done"
  | "secret_capture"
  | "secret_success";

const ALLOWED_STEPS: FunnelStep[] = [
  "scope", "intent_filter", "status", "comp_a", "comp_b",
  "contact", "identity", "intent", "call", "timeframe",
  "done", "secret_capture", "secret_success",
];

export default function About() {
  const [searchParams, setSearchParams] = useSearchParams();

  const isDirectEntry = searchParams.get("startArb") === "1";
  const source = searchParams.get("src") || "unknown";
  const rawStep = searchParams.get("step") || "scope";
  const initialStep: FunnelStep = ALLOWED_STEPS.includes(rawStep as FunnelStep)
    ? (rawStep as FunnelStep)
    : "scope";

  useEffect(() => {
    trackEvent({
      event_name: "about_page_opened",
      route: "/about",
      metadata: { direct_entry: isDirectEntry, source },
    });
  }, [isDirectEntry, source]);

  const handleTrack = (eventName: string) => {
    trackEvent({
      event_name: eventName,
      route: "/about",
      metadata: { direct_entry: isDirectEntry, source },
    });
  };

  const clearDirectEntryParams = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("startArb");
    next.delete("step");
    next.delete("src");
    setSearchParams(next, { replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(170deg, #dce8f4 0%, #e4edf6 30%, #eaeff8 60%, #dde6f2 100%)" }}>
      <AboutHero onTrack={handleTrack} />
      <MarketProblemSection />
      <InformationAsymmetrySection onTrack={handleTrack} />
      <WhyPricesVarySection />
      <NotAContractorSection />
      <HowWindowManWorksSection />

      {isDirectEntry ? (
        <section className="relative px-6 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <ArbitrageEngine
              autoOpen
              hideBaseShell
              source={source}
              initialStep={initialStep}
              onDirectEntryClose={clearDirectEntryParams}
            />
          </div>
        </section>
      ) : (
        <ArbitrageEngineSection />
      )}

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
