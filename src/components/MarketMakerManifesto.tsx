import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Home, Wrench, BarChart3, Check, Scale, ArrowRight, ArrowDown } from "lucide-react";
import windowmanHero from "@/assets/windowman-truth.avif";

const listItems = [
  "Free AI analysis of your quote",
  "Red flags explained in plain English",
  "Fair-market price for your county",
  "A negotiation script for your situation",
  "An introduction to a vetted contractor who will beat your price",
];

interface MarketMakerManifestoProps { onDemoClick?: () => void; }

const MarketMakerManifesto = ({ onDemoClick }: MarketMakerManifestoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.15, delay },
  });

  return (
    <section style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div ref={ref} className="mx-auto px-4 md:px-8 py-24 md:py-32" style={{ maxWidth: 1080 }}>
        <motion.p {...fade(0)} className="text-center" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.12em", marginBottom: 24, fontWeight: 700 }}>
          HOW WINDOWMAN ACTUALLY WORKS
        </motion.p>
        <motion.h2 {...fade(0.05)} className="text-center mx-auto" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(38px, 5.5vw, 52px)", color: "#FFFFFF", fontWeight: 800, lineHeight: 1.1, maxWidth: 680, marginBottom: 20, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          WE KEEP BOTH SIDES HONEST
        </motion.h2>
        <motion.p {...fade(0.08)} className="text-center mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 19, color: "rgba(229,231,235,0.85)", lineHeight: 1.65, maxWidth: 580, marginBottom: 60 }}>
          Most services profit from information asymmetry.<br />WindowMan profits from eliminating it.
        </motion.p>

        <motion.div {...fade(0.1)} className="mx-auto flex flex-col md:flex-row items-center justify-between" style={{ maxWidth: 840, marginBottom: 64 }}>
          <div className="flex flex-col items-center" style={{ minWidth: 120 }}>
            <div className="flex items-center justify-center" style={{ width: 88, height: 88, background: "rgba(37,99,235,0.1)", border: "1.5px solid rgba(37,99,235,0.25)", boxShadow: "0 4px 16px rgba(37,99,235,0.15)" }}>
              <Home size={36} color="#2563EB" strokeWidth={2} />
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginTop: 14 }}>You</span>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0 md:flex-1 md:px-4">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#2563EB", marginBottom: 6, textAlign: "center", fontWeight: 700, letterSpacing: "0.05em" }}>quote + intent</span>
            <ArrowRight size={32} color="#2563EB" className="hidden md:block" />
            <ArrowDown size={24} color="#2563EB" className="md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 160, maxWidth: 300 }}>
            <img src={windowmanHero} alt="WindowMan superhero" style={{ width: "100%", maxWidth: 280, height: "auto" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginTop: 10 }}>WindowMan</span>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0 md:flex-1 md:px-4">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#2563EB", marginBottom: 6, textAlign: "center", fontWeight: 700, letterSpacing: "0.05em" }}>warm lead + intel</span>
            <ArrowRight size={32} color="#2563EB" className="hidden md:block" />
            <ArrowDown size={24} color="#2563EB" className="md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 120 }}>
            <div className="flex items-center justify-center" style={{ width: 88, height: 88, background: "rgba(37,99,235,0.1)", border: "1.5px solid rgba(37,99,235,0.25)", boxShadow: "0 4px 16px rgba(37,99,235,0.15)" }}>
              <Wrench size={36} color="#2563EB" strokeWidth={2} />
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginTop: 14 }}>The Contractor</span>
          </div>
        </motion.div>

        <motion.div {...fade(0.12)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Check size={16} color="#2563EB" strokeWidth={3} />, title: "What Do You Get — Free", borderColor: "rgba(37,99,235,0.25)", bgColor: "rgba(37,99,235,0.05)", content: listItems.map((item, i) => (
              <div key={i} className="flex gap-2.5 items-start" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(229,231,235,0.88)", lineHeight: 2.0 }}>
                <span style={{ color: "#2563EB", flexShrink: 0, fontWeight: 700 }}>→</span><span>{item}</span>
              </div>
            ))},
            { icon: <Scale size={16} color="#C8952A" strokeWidth={2.5} />, title: "​So How Do I Make Money", borderColor: "rgba(200,149,42,0.25)", bgColor: "rgba(200,149,42,0.05)", content: <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(229,231,235,0.88)", lineHeight: 1.85, marginTop: 12 }}>WindowMan earns a percentage of the sale — only when you choose to work with one of our contractors and your project is completed. We never charge homeowners.</p> },
            { icon: <BarChart3 size={16} color="#2563EB" strokeWidth={2.5} />, title: "Why Work With Me", borderColor: "rgba(37,99,235,0.25)", bgColor: "rgba(37,99,235,0.05)", content: <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(229,231,235,0.88)", lineHeight: 1.85, marginTop: 12 }}>Every homeowner we introduce already understands fair-market pricing. Our contractors walk into conversations that are already halfway won.</p> },
          ].map((card, i) => (
            <div key={i} style={{ background: card.bgColor, border: `1px solid ${card.borderColor}`, padding: "30px 26px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: `${card.borderColor}`, border: `1px solid ${card.borderColor}` }}>
                  {card.icon}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>{card.title}</span>
              </div>
              <div style={{ marginTop: 14 }}>{card.content}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default MarketMakerManifesto;
