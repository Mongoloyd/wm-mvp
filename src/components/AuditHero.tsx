import React from "react";
import { motion } from "framer-motion";
import { TrustBullets } from "./TrustBullets";
import SampleGradeCard from "./SampleGradeCard";
import { useTickerStats } from "@/hooks/useTickerStats";
import { Shield, TrendingDown, BarChart3 } from "lucide-react";

const PowerToolFlow = React.lazy(() => import("./PowerToolDemo"));

const MASCOT_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/87108037/YjBTWCdi7jZwa5GFcxbLnp/windowmanwithtruthreportonthephone_be309c26.avif";

interface AuditHeroProps {
  onUploadQuote?: () => void;
  triggerPowerTool?: boolean;
  onPowerToolClose?: () => void;
  variantHeadline?: string;
  variantSubheadline?: string;
  variantBadgeText?: string;
}

const AuditHero = ({
  onUploadQuote,
  triggerPowerTool,
  onPowerToolClose,
  variantHeadline,
  variantSubheadline,
  variantBadgeText,
}: AuditHeroProps) => {
  const { total } = useTickerStats();
  const savingsFound = ((total * 3800) / 1_000_000).toFixed(1);

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
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          {/* ── ORDER 1 (mobile): Trust Pill ── */}
          <div className="order-1 md:hidden z-10 mt-4 inline-flex items-center gap-2 card-raised px-3 py-1 bg-primary/5">
            {trustPillContent}
          </div>

          {/* ── ORDER 2 (mobile) / right column (md+): Mascot + GradeCard ── */}
          <div className="order-2 md:order-last md:flex-1 flex flex-col items-center pt-0 md:pt-16">
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
                  The Impact Window Industry Has No Pricing Transparency Standard.
                  <br />
                  WindowMan Built One — and It Audits Your Quote In{" "}
                  <strong style={{ color: "hsl(210 50% 8%)" }}>under 60 seconds</strong>.
                </>
              )}
            </p>

            {/* ── CTA ROW: side-by-side on md+, stacked on mobile ── */}
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
              <button
                onClick={() => onUploadQuote?.()}
                className="btn-depth-primary w-full md:w-auto whitespace-nowrap"
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

            <TrustBullets />

            {/* ── Desktop stats strip — fills vertical gap below bullets ── */}
            <div className="hidden md:flex items-center gap-6 mt-8 pt-6 border-t border-border/40 w-full">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold tabular-nums" style={{ color: "hsl(210 50% 8%)" }}>
                    {total.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Quotes Scanned</p>
                </div>
              </div>

              <div className="w-px h-8 bg-border/50" />

              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold tabular-nums" style={{ color: "hsl(210 50% 8%)" }}>
                    ${savingsFound}M+
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Overcharges Found</p>
                </div>
              </div>

              <div className="w-px h-8 bg-border/50" />

              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold tabular-nums" style={{ color: "hsl(210 50% 8%)" }}>
                    $3,100
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Avg. Savings</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AuditHero;
