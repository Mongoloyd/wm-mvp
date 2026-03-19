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
    <section style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid #1A1A1A" }}>
      <div ref={ref} className="mx-auto px-4 md:px-8 py-20 md:py-28" style={{ maxWidth: 1080 }}>
        <motion.p {...fade(0)} className="text-center" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#2563EB", letterSpacing: "0.12em", marginBottom: 20 }}>
          HOW WINDOWMAN ACTUALLY WORKS
        </motion.p>
        <motion.h2 {...fade(0.02)} className="text-center mx-auto" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 5vw, 48px)", color: "#E5E5E5", fontWeight: 800, lineHeight: 1.15, maxWidth: 680, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.01em" }}>
          WE KEEP BOTH SIDES HONEST
        </motion.h2>
        <motion.p {...fade(0.04)} className="text-center mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#6B7280", lineHeight: 1.7, maxWidth: 560, marginBottom: 56 }}>
          Most services profit from information asymmetry.<br />WindowMan profits from eliminating it.
        </motion.p>

        <motion.div {...fade(0.06)} className="mx-auto flex flex-col md:flex-row items-center justify-between" style={{ maxWidth: 800, marginBottom: 56 }}>
          <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
            <div className="flex items-center justify-center" style={{ width: 80, height: 80, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <Home size={32} color="#2563EB" />
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#E5E5E5", marginTop: 12 }}>You</span>
          </div>
          <div className="flex flex-col items-center py-3 md:py-0 md:flex-1 md:px-3">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#2563EB", marginBottom: 4, textAlign: "center" }}>quote + intent</span>
            <ArrowRight size={32} color="#2563EB" className="hidden md:block" />
            <ArrowDown size={24} color="#2563EB" className="md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 140, maxWidth: 280 }}>
            <img src={windowmanHero} alt="WindowMan superhero" style={{ width: "100%", maxWidth: 260, height: "auto" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#E5E5E5", marginTop: 8 }}>WindowMan</span>
          </div>
          <div className="flex flex-col items-center py-3 md:py-0 md:flex-1 md:px-3">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#2563EB", marginBottom: 4, textAlign: "center" }}>warm lead + intel</span>
            <ArrowRight size={32} color="#2563EB" className="hidden md:block" />
            <ArrowDown size={24} color="#2563EB" className="md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
            <div className="flex items-center justify-center" style={{ width: 80, height: 80, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <Wrench size={32} color="#2563EB" />
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#E5E5E5", marginTop: 12 }}>The Contractor</span>
          </div>
        </motion.div>

        <motion.div {...fade(0.1)} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <Check size={16} color="#2563EB" strokeWidth={3} />, title: "What Do You Get — Free", borderColor: "rgba(37,99,235,0.2)", bgColor: "rgba(37,99,235,0.04)", content: listItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-start" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", lineHeight: 2.0 }}>
                <span style={{ color: "#2563EB", flexShrink: 0 }}>→</span><span>{item}</span>
              </div>
            ))},
            { icon: <Scale size={16} color="#C8952A" strokeWidth={2.5} />, title: "​So How Do I Make Money", borderColor: "rgba(200,149,42,0.2)", bgColor: "rgba(200,149,42,0.04)", content: <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", lineHeight: 1.9, marginTop: 12 }}>WindowMan earns a percentage of the sale — only when you choose to work with one of our contractors and your project is completed. We never charge homeowners.</p> },
            { icon: <BarChart3 size={16} color="#2563EB" strokeWidth={2.5} />, title: "Why Work With Me", borderColor: "rgba(37,99,235,0.2)", bgColor: "rgba(37,99,235,0.04)", content: <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", lineHeight: 1.9, marginTop: 12 }}>Every homeowner we introduce already understands fair-market pricing. Our contractors walk into conversations that are already halfway won.</p> },
          ].map((card, i) => (
            <div key={i} style={{ background: card.bgColor, border: `1px solid ${card.borderColor}`, padding: "26px 22px" }}>
              <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
                <div className="flex items-center justify-center" style={{ width: 36, height: 36, background: `${card.borderColor}`, border: `1px solid ${card.borderColor}` }}>
                  {card.icon}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>{card.title}</span>
              </div>
              <div style={{ marginTop: 12 }}>{card.content}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default MarketMakerManifesto;
