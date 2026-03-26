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
    <section className="relative bg-background">

      {/* ── MASCOT: Overlapping Trio anchor ── */}
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

      {/* ── HERO GRID ── */}
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
              className="inline-flex items-center gap-2 mb-5 bg-primary/5 border border-primary/20 px-3 py-1"
            >
              <span className="text-primary text-sm">🛡</span>
              <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-primary">
                FORENSIC QUOTE INTELLIGENCE
              </span>
            </div>

            <h1
              className="font-display text-foreground uppercase leading-[1.1] mb-5"
              style={{
                fontSize: "clamp(40px, 5vw, 58px)",
                fontWeight: 900,
                letterSpacing: "0.01em",
              }}
            >
              YOUR QUOTE LOOKS LEGITIMATE.
              <br />
              THAT'S EXACTLY WHAT <span className="text-destructive">THEY'RE COUNTING ON.</span>
            </h1>

            <p
              className="font-body text-muted-foreground leading-[1.7] mb-8"
              style={{ fontSize: "clamp(16px, 2vw, 18px)" }}
            >
              The impact window industry has no pricing transparency standard.
              <br />
              WindowMan built one — and it reads your quote in{" "}
              <strong className="text-foreground">under 60 seconds</strong>.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 md:gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUploadQuote?.()}
                className="btn-depth-primary w-full sm:w-auto whitespace-nowrap py-4 px-6 sm:px-8 hover:shadow-lg transition-shadow"
                style={{ fontSize: 16 }}
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
                className="w-full lg:w-auto transition-colors py-3.5 px-4 lg:px-6 cursor-pointer relative flex flex-col lg:flex-row lg:items-center lg:gap-2 bg-primary/5 border border-primary/20 text-foreground"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center bg-primary text-primary-foreground font-mono text-[9px] font-bold tracking-[0.05em] px-1.5 py-0.5">
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
              {/* Subtle glow behind card */}
              <div
                className="absolute -inset-6 rounded-full -z-10"
                style={{ background: "rgba(37,99,235,0.06)", filter: "blur(40px)" }}
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
