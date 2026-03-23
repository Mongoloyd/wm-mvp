import React from "react";
import { motion } from "framer-motion";
import { TrustBullets } from "./TrustBullets";
import SampleGradeCard from "./SampleGradeCard";

const PowerToolFlow = React.lazy(() => import("./PowerToolDemo"));

interface AuditHeroProps {
  onFlowBClick?: () => void;
  onUploadQuote?: () => void;
  triggerPowerTool?: boolean;
  onPowerToolClose?: () => void;
}

const AuditHero = ({ onFlowBClick, onUploadQuote, triggerPowerTool, onPowerToolClose }: AuditHeroProps) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section style={{ backgroundColor: "#0A0A0A" }}>
      {/* WindowMan mascot — centered at natural size above hero content */}
      <div className="flex justify-center pt-8 pb-0">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/87108037/YjBTWCdi7jZwa5GFcxbLnp/windowmanwithtruthreportonthephone_be309c26.avif"
          alt="WindowMan holding a Truth Report"
          fetchPriority="high"
          decoding="async"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </div>
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Mobile wordmark */}
          <div className="md:hidden order-0 flex flex-col items-center text-center gap-3">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "0.02em", color: "#E5E5E5", lineHeight: 1.1 }}>
              WINDOW<span style={{ color: "#C8952A" }}>MAN</span>
            </h2>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#2563EB" }}>
              FORENSIC QUOTE ANALYSIS
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="order-1"
          >
            <div
              className="inline-flex items-center gap-2 mb-5"
              style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.3)", padding: "4px 12px" }}
            >
              <span style={{ color: "#2563EB", fontSize: 14 }}>🛡</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#2563EB" }}>
                FORENSIC QUOTE INTELLIGENCE
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(40px, 5vw, 58px)",
              fontWeight: 900,
              letterSpacing: "0.01em",
              color: "#E5E5E5",
              lineHeight: 1.1,
              marginBottom: 20,
              textTransform: "uppercase",
            }}>
              YOUR QUOTE LOOKS LEGITIMATE.
              <br />
              THAT'S EXACTLY WHAT <span style={{ color: "#F97316" }}>THEY'RE COUNTING ON.</span>
            </h1>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(16px, 2vw, 18px)",
              fontWeight: 400,
              color: "#E5E7EB",
              lineHeight: 1.7,
              marginBottom: 32,
            }}>
              The impact window industry has no pricing transparency standard.
              <br />
              WindowMan built one — and it reads your quote in{" "}
              <strong style={{ color: "#E5E5E5" }}>under 60 seconds</strong>.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 md:gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo("truth-gate")}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  border: "none",
                  boxShadow: "0 4px 24px rgba(37,99,235,0.35)",
                  cursor: "pointer",
                }}
                className="w-full sm:w-auto whitespace-nowrap py-4 px-6 sm:px-8 hover:shadow-lg transition-shadow"
              >
                Scan My Quote<span className="inline md:hidden lg:inline"> — It's Free</span>
              </motion.button>
              <React.Suspense fallback={<div className="h-[54px]" />}>
                <PowerToolFlow
                  onUploadQuote={onUploadQuote}
                  triggerOpen={triggerPowerTool}
                  onToolClose={onPowerToolClose}
                />
              </React.Suspense>
            </div>

            <div className="mt-2 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFlowBClick?.()}
                className="w-full lg:w-auto transition-colors py-3.5 px-4 lg:px-6 cursor-pointer relative flex flex-col lg:flex-row lg:items-center lg:gap-2"
                style={{
                  background: "rgba(37,99,235,0.06)",
                  border: "1px solid rgba(37,99,235,0.25)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#E5E5E5",
                }}
              >
                <span className="flex items-center gap-2">
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#2563EB",
                    color: "#FFFFFF",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    padding: "2px 6px",
                  }}>
                    NEW
                  </span>
                  <span>Getting Quotes Soon?</span>
                </span>
                <span className="ml-[4.5ch] lg:ml-0">We Can Arm You 1st →</span>
              </motion.button>
            </div>

            <TrustBullets />
          </motion.div>

          <div className="order-2 flex flex-col items-center">
            <div className="hidden md:block">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.1 }}
              >
                <SampleGradeCard />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditHero;
