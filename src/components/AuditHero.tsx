import React from "react";
import { motion } from "framer-motion";
import { TrustBullets } from "./TrustBullets";
import SampleGradeCard from "./SampleGradeCard";

const PowerToolFlow = React.lazy(() => import("./PowerToolDemo"));

const MASCOT_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/87108037/YjBTWCdi7jZwa5GFcxbLnp/windowmanwithtruthreportonthephone_be309c26.avif";

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
    <section className="relative" style={{ backgroundColor: "#0A0A0A" }}>

      {/* ── MASCOT: Overlapping Trio anchor ──────────────────────────────
          Negative bottom margin pulls the grid up underneath him.
          z-20 keeps his phone arm on top of the GradeCard.
          pointer-events-none lets clicks pass through to buttons below.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        className="relative z-20 flex justify-center pt-8 pointer-events-none
                   -mb-16 sm:-mb-20 lg:-mb-32"
      >
        <img
          src={MASCOT_URL}
          alt="WindowMan holding a Truth Report"
          fetchPriority="high"
          decoding="async"
          className="w-32 sm:w-48 md:w-64 lg:w-96 h-auto object-contain"
        />
      </div>

      {/* ── HERO GRID: widened to max-w-7xl, 12-col with center void ──── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT — Typography (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="lg:col-span-5 pt-8 lg:pt-20"
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

          {/* CENTER — "The Void": mascot throne (2 cols, desktop only) */}
          <div className="hidden lg:block lg:col-span-2" aria-hidden="true" />

          {/* RIGHT — Floating GradeCard (5 cols) */}
          <div className="lg:col-span-5 relative flex flex-col items-center pt-4 lg:pt-16">
            <div className="hidden md:block relative z-10">
              {/* Subtle glow behind card — emphasises the "Truth" reveal */}
              <div
                className="absolute -inset-6 rounded-full -z-10"
                style={{ background: "rgba(37,99,235,0.08)", filter: "blur(40px)" }}
              />
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
