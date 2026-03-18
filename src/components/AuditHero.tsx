import React from "react";
import { motion } from "framer-motion";
import handScannerHero from "@/assets/hand-scanner-hero.webp";
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
    <section style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="md:hidden order-0 flex flex-col items-center text-center gap-3">
            <h2
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "#0F1F35",
                lineHeight: 1.1,
              }}
            >
              WINDOW<span style={{ color: "#C8952A" }}>MAN</span>
            </h2>
            <img
              src={handScannerHero}
              alt="WindowMan forensic quote scanner"
              style={{ maxWidth: "85vw", maxHeight: "40vh", objectFit: "contain" }}
            />
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#6B7280",
              }}
              className="text-cyan-400 font-bold"
            >
              FORENSIC QUOTE ANALYSIS
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="order-1"
          >
            <div
              className="inline-flex items-center gap-2 mb-5"
              style={{ background: "#FDF3E3", border: "1px solid #C8952A", borderRadius: 6, padding: "4px 12px" }}
            >
              <span style={{ color: "#C8952A", fontSize: 14 }}>🛡</span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "#C8952A",
                }}
              >
                IMPACT WINDOW QUOTES WITH AI
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "clamp(40px, 5vw, 54px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#0F1F35",
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Your Quote Looks Legitimate.
              <br />
              That's Exactly What <span style={{ color: "#C8952A" }}>They're Counting On.</span>
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "clamp(18px, 2vw, 20px)",
                fontWeight: 400,
                color: "#374151",
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              The impact window industry has no pricing transparency standard.
              <br />
              WindowMan built one — and it reads your quote in{" "}
              <strong style={{ color: "#0F1F35" }}>under 60 seconds</strong>.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 md:gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo("truth-gate")}
                style={{
                  background: "#C8952A",
                  color: "#FFFFFF",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 4px 14px rgba(200, 149, 42, 0.35)",
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
            <div className="mt-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFlowBClick?.()}
                className="w-full sm:w-auto whitespace-nowrap bg-emerald-950/40 hover:bg-emerald-900/60 border-2 border-emerald-800/60 hover:border-emerald-700/80 text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-colors rounded-[10px] py-3.5 px-4 sm:px-6 cursor-pointer relative"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#10b981",
                    color: "#000000",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    padding: "2px 6px",
                    borderRadius: 4,
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                >
                  NEW
                </span>
                Getting Quotes Soon? We Can Arm You First →
              </motion.button>
            </div>
            <TrustBullets />
          </motion.div>
          <div className="order-2 flex flex-col items-center">
            <div className="hidden md:block">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
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
