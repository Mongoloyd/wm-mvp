import { useEffect } from "react";
import { trackEvent } from "@/lib/trackEvent";
import AboutHeader from "@/components/about/AboutHeader";
import AboutHero from "@/components/about/AboutHero";
import MarketProblemSection from "@/components/about/MarketProblemSection";

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
    </main>
  );
}
