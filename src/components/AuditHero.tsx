import React from "react";
import { motion } from "framer-motion";
import handScannerHero from "@/assets/hand-scanner-hero.webp";

const PowerToolFlow = React.lazy(() => import("./PowerToolDemo"));

const flagCards = [
  {
    stripe: "#DC2626",
    icon: "⚠",
    label: "No Window Brand Specified",
    labelColor: "#DC2626",
    sub: "Contractor can install any quality level",
  },
  {
    stripe: "#F59E0B",
    icon: "⚡",
    label: "Labor Warranty: 1 Year Only",
    labelColor: "#D97706",
    sub: "Industry standard is 2–5 years",
  },
  {
    stripe: "#059669",
    icon: "✓",
    label: "Permit Cost Included",
    labelColor: "#059669",
    sub: "This is correctly structured",
  },
];



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
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
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
                  padding: "16px 32px",
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 4px 14px rgba(200, 149, 42, 0.35)",
                  cursor: "pointer",
                }}
                className="hover:shadow-lg transition-shadow"
              >
                Scan My Quote — It's Free
              </motion.button>
              <React.Suspense fallback={<div className="h-[54px]" />}>
                <PowerToolFlow
                  onUploadQuote={onUploadQuote}
                  triggerOpen={triggerPowerTool}
                  onToolClose={onPowerToolClose}
                />
              </React.Suspense>
            </div>
            <div className="flex flex-col mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFlowBClick?.()}
                className="relative"
                style={{
                  background: "transparent",
                  color: "#374151",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  padding: "14px 24px",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0F1F35";
                  e.currentTarget.style.color = "#0F1F35";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#D1D5DB";
                  e.currentTarget.style.color = "#374151";
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#059669",
                    color: "#FFFFFF",
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
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                animate={{ y: [-6, 0, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 8px 40px rgba(15, 31, 53, 0.12)",
                  maxWidth: 420,
                  width: "100%",
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#6B7280",
                    letterSpacing: "0.12em",
                    marginBottom: 20,
                  }}
                >
                  SAMPLE GRADE REPORT
                </p>
                <div className="text-center">
                  <div
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: 96,
                      fontWeight: 800,
                      color: "#F97316",
                      lineHeight: 1,
                    }}
                  >
                    C
                  </div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                    GRADE C — REVIEW BEFORE SIGNING
                  </p>
                </div>
                <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "12px 16px", marginTop: 16 }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", color: "#DC2626", fontWeight: 700, fontSize: 16 }}>
                    $4,800 Above Fair Market
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                    Broward County Benchmark · Q1 2025
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {flagCards.map((flag, i) => (
                    <div
                      key={i}
                      className="flex overflow-hidden"
                      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8 }}
                    >
                      <div style={{ width: 3, backgroundColor: flag.stripe, flexShrink: 0 }} />
                      <div style={{ padding: "10px 14px" }}>
                        <p
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: flag.labelColor,
                          }}
                        >
                          {flag.icon} {flag.label}
                        </p>
                        <p
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", marginTop: 2 }}
                        >
                          {flag.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center" style={{ borderTop: "1px solid #E5E7EB", marginTop: 16, paddingTop: 14 }}>
                  <p
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: "italic", color: "#9CA3AF" }}
                  >
                    This is a sample. Your quote will generate a real grade.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditHero;
