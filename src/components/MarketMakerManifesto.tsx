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

interface MarketMakerManifestoProps {
  onDemoClick?: () => void;
}

const MarketMakerManifesto = ({ onDemoClick }: MarketMakerManifestoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.5, delay },
  });

  return (
    <section className="frosted-card-dark frosted-section-spacing">
      <div ref={ref} className="mx-auto px-4 md:px-8 py-20 md:py-28" style={{ maxWidth: 1080 }}>
        <motion.p
          {...fade(0)}
          className="text-center"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 14,
            color: "#0099BB",
            letterSpacing: "0.12em",
            marginBottom: 20,
          }}
        >
          HOW WINDOWMAN ACTUALLY WORKS
        </motion.p>
        <motion.h2
          {...fade(0.05)}
          className="text-center mx-auto"
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "clamp(36px, 5vw, 46px)",
            color: "#FFFFFF",
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 680,
            marginBottom: 16,
          }}
        >
          We Keep Both Sides Honest
        </motion.h2>
        <motion.p
          {...fade(0.1)}
          className="text-center mx-auto"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            color: "#94A3B8",
            lineHeight: 1.7,
            maxWidth: 560,
            marginBottom: 56,
          }}
        >
          Most services profit from information asymmetry.
          <br />
          WindowMan profits from eliminating it.
        </motion.p>

        <motion.div
          {...fade(0.15)}
          className="mx-auto flex flex-col md:flex-row items-center justify-between"
          style={{ maxWidth: 800, marginBottom: 56 }}
        >
          <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(5,150,105,0.12)",
                border: "2px solid rgba(5,150,105,0.35)",
              }}
            >
              <Home size={32} color="#059669" />
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#FFFFFF",
                marginTop: 12,
              }}
            >
              You
            </span>
          </div>
          <div className="flex flex-col items-center py-3 md:py-0 md:flex-1 md:px-3">
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#C8952A",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              quote + intent
            </span>
            <ArrowRight size={32} color="#C8952A" className="hidden md:block" />
            <ArrowDown size={24} color="#C8952A" className="md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 140, maxWidth: 280 }}>
            <img
              src={windowmanHero}
              alt="WindowMan superhero"
              style={{ width: "100%", maxWidth: 260, height: "auto" }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#FFFFFF",
                marginTop: 8,
              }}
            >
              WindowMan
            </span>
          </div>
          <div className="flex flex-col items-center py-3 md:py-0 md:flex-1 md:px-3">
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#C8952A",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              warm lead + intel
            </span>
            <ArrowRight size={32} color="#C8952A" className="hidden md:block" />
            <ArrowDown size={24} color="#C8952A" className="md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(0,153,187,0.12)",
                border: "2px solid rgba(0,153,187,0.35)",
              }}
            >
              <Wrench size={32} color="#0099BB" />
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#FFFFFF",
                marginTop: 12,
              }}
            >
              The Contractor
            </span>
          </div>
        </motion.div>

        <motion.div {...fade(0.25)} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            style={{
              background: "rgba(5,150,105,0.07)",
              border: "1px solid rgba(5,150,105,0.18)",
              borderRadius: 12,
              padding: "26px 22px",
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(5,150,105,0.15)",
                  border: "1px solid rgba(5,150,105,0.3)",
                }}
              >
                <Check size={16} color="#059669" strokeWidth={3} />
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>
                What Do You Get — Free
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              {listItems.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#D1D5DB", lineHeight: 2.0 }}
                >
                  <span style={{ color: "#059669", flexShrink: 0 }}>→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              background: "rgba(200,149,42,0.07)",
              border: "1px solid rgba(200,149,42,0.18)",
              borderRadius: 12,
              padding: "26px 22px",
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(200,149,42,0.15)",
                  border: "1px solid rgba(200,149,42,0.3)",
                }}
              >
                <Scale size={16} color="#C8952A" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>
                ​So How Do I Make Money
              </span>
            </div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#D1D5DB",
                lineHeight: 1.9,
                marginTop: 12,
              }}
            >
              WindowMan earns a percentage of the sale — only when you choose to work with one of our contractors and
              your project is completed. We never charge homeowners.
            </p>
          </div>
          <div
            style={{
              background: "rgba(0,153,187,0.07)",
              border: "1px solid rgba(0,153,187,0.18)",
              borderRadius: 12,
              padding: "26px 22px",
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(0,153,187,0.15)",
                  border: "1px solid rgba(0,153,187,0.3)",
                }}
              >
                <BarChart3 size={16} color="#0099BB" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>
                Why Work With Me
              </span>
            </div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#D1D5DB",
                lineHeight: 1.9,
                marginTop: 12,
              }}
            >
              Every homeowner we introduce already understands fair-market pricing. Our contractors walk into
              conversations that are already halfway won.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketMakerManifesto;
