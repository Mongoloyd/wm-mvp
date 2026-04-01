import { useEffect } from "react";
import { trackEvent } from "@/lib/trackEvent";
import AboutHeader from "@/components/about/AboutHeader";
import AboutHero from "@/components/about/AboutHero";
import MarketProblemSection from "@/components/about/MarketProblemSection";
import InformationAsymmetrySection from "@/components/about/InformationAsymmetrySection";
import WhyPricesVarySection from "@/components/about/WhyPricesVarySection";
import NotAContractorSection from "@/components/about/NotAContractorSection";

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
    <main className="min-h-screen bg-slate-100">
      <AboutHeader />
      <AboutHero onTrack={handleTrack} />
      <MarketProblemSection />
      <InformationAsymmetrySection onTrack={handleTrack} />
      <WhyPricesVarySection />
      <NotAContractorSection />
    </main>
  );
}
