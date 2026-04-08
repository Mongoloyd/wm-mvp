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

  variantHeadline?: string;

  variantSubheadline?: string;

  variantBadgeText?: string;
}

const AuditHero = ({
  onFlowBClick,
  onUploadQuote,
  triggerPowerTool,
  onPowerToolClose,
  variantHeadline,
  variantSubheadline,
  variantBadgeText,
}: AuditHeroProps) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const trustPillContent = (
    <>
      <span className="text-primary text-sm">🛡️</span>

      <span className="wm-eyebrow text-primary">{variantBadgeText || "FORENSIC QUOTE INTELLIGENCE"}</span>
    </>
  );

  return (
    <section
      className="relative bg-background"
      style={{
        background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)",
      }}
    >
      {/* ── HERO LAYOUT: flex-col on mobile, flex-row on md+ ── */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          {/* ── ORDER 1 (mobile): Trust Pill ── */}

          <div className="order-1 md:hidden z-10 mt-4 inline-flex items-center gap-2 card-raised px-3 py-1 bg-primary/5">
            {trustPillContent}
          </div>

          {/* ── ORDER 2 (mobile) / right column (md+): Mascot + GradeCard ── */}

          <div className="order-2 md:order-last md:flex-1 flex flex-col items-center pt-0 md:pt-16">
            {/* Mascot */}

            <div className="relative z-20 flex justify-center pointer-events-none w-full">
              <motion.div
                animate={{ y: [-8, 0, -8] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src={MASCOT_URL}
                  alt="WindowMan holding a Truth Report"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full max-w-md md:w-80 lg:w-[480px] h-auto object-contain"
                />
              </motion.div>
            </div>

            {/* GradeCard — desktop only */}

            <div className="hidden md:block relative z-10">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.1 }}
              >
                <SampleGradeCard />
              </motion.div>
            </div>
          </div>

          {/* ── ORDER 3 (mobile) / left column (md+): Text + CTAs ── */}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="order-3 md:order-first md:flex-1 mt-8 md:mt-0 md:pt-20 flex flex-col items-center md:items-start"
          >
            {/* Pill — desktop only (mobile pill is rendered above as order-1) */}

            <div className="hidden md:inline-flex items-center gap-2 mb-5 card-raised px-3 py-1 bg-primary/5">
              {trustPillContent}
            </div>

            <h1
              className="font-display uppercase leading-[1.08] mb-5"
              style={{
                fontSize: "clamp(40px, 5vw, 58px)",

                fontWeight: 900,

                letterSpacing: "-0.005em",

                color: "hsl(210 50% 8%)",
              }}
            >
              {variantHeadline ? (
                variantHeadline
              ) : (
                <>
                  YOUR QUOTE LOOKS LEGITIMATE.
                  <br />
                  THAT'S EXACTLY WHAT{" "}
                  <span className="text-destructive" style={{ textShadow: "0 0 20px hsla(25, 95%, 53%, 0.15)" }}>
                    THEY'RE COUNTING ON.
                  </span>
                </>
              )}
            </h1>

            <p
              className="font-body mb-8"
              style={{ fontSize: "clamp(16px, 2vw, 18px)", lineHeight: 1.7, color: "hsl(215 20% 28%)" }}
            >
              {variantSubheadline ? (
                variantSubheadline
              ) : (
                <>
                  The impact window industry has no pricing transparency standard.
                  <br />
                  WindowMan built one — and it reads your quote in{" "}
                  <strong style={{ color: "hsl(210 50% 8%)" }}>under 60 seconds</strong>.
                </>
              )}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 md:gap-4 w-full">
              {/* Hero CTA — largest on page */}

              <button
                onClick={() => onUploadQuote?.()}
                className="btn-depth-primary w-full sm:w-auto whitespace-nowrap"
                style={{ fontSize: 18, padding: "20px 40px" }}
              >
                Scan My Quote<span className="inline md:hidden lg:inline"> — It's Free</span>
              </button>

              <React.Suspense fallback={<div className="h-[54px]" />}>
                <PowerToolFlow
                  onUploadQuote={onUploadQuote}
                  triggerOpen={triggerPowerTool}
                  onToolClose={onPowerToolClose}
                />
              </React.Suspense>
            </div>

            <div className="mt-2 w-full md:w-auto">
              <button
                onClick={() => onFlowBClick?.()}
                className="w-full md:w-auto btn-secondary-tactile cursor-pointer relative flex flex-col md:flex-row md:items-center md:gap-2 text-foreground"
                style={{ padding: "12px 20px" }}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center bg-primary text-primary-foreground font-mono text-[9px] font-bold tracking-[0.05em] px-1.5 py-0.5">
                    NEW
                  </span>

                  <span>Getting Quotes Soon- Start Here</span>
                </span>

                <span className="ml-[4.5ch] md:ml-0"> →</span>
              </button>
            </div>

            <TrustBullets />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AuditHero;
