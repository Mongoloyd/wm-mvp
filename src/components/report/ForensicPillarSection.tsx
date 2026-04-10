/**
 * ForensicPillarSection — Ranked pillar display with VerdictPositionBar.
 *
 * Replaces the flat 5-pillar grid with a severity-ranked vertical stack.
 * - Rank 1 (dominant): expanded card with full detail + tactical icon
 * - Rank 2–3 (elevated): standard cards
 * - Rank 4–5 (safe): recessed, collapsed
 * - Pre-OTP: only Rank 1 fully visible; ranks 2–5 blurred with unlock overlay
 */

import { motion } from "framer-motion";
import { Shield, Ruler, DollarSign, FileText, ShieldCheck, ShieldAlert, MessageSquare, Lock } from "lucide-react";
import type { PillarScore, AnalysisFlag } from "@/hooks/useAnalysisData";
import { rankPillars, type RankedPillar } from "@/utils/pillarRanking";
import VerdictPositionBar from "@/components/report/VerdictPositionBar";

interface ForensicPillarSectionProps {
  pillarScores: PillarScore[];
  flags: AnalysisFlag[];
  county: string;
  isFull: boolean;
}

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  safety_code: <Shield size={20} />,
  install_scope: <Ruler size={20} />,
  price_fairness: <DollarSign size={20} />,
  fine_print: <FileText size={20} />,
  warranty: <ShieldCheck size={20} />,
};

const STATUS_CONFIG = {
  pass: {
    color: "hsl(var(--color-emerald))",
    bg: "hsl(var(--color-emerald) / 0.12)",
    border: "hsl(var(--color-emerald) / 0.3)",
    label: "PASS",
  },
  warn: {
    color: "hsl(var(--color-caution))",
    bg: "hsl(var(--color-caution) / 0.12)",
    border: "hsl(var(--color-caution) / 0.3)",
    label: "REVIEW",
  },
  fail: {
    color: "hsl(var(--color-danger))",
    bg: "hsl(var(--color-danger) / 0.12)",
    border: "hsl(var(--color-danger) / 0.3)",
    label: "FAIL",
  },
  pending: {
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--secondary))",
    border: "hsl(var(--border))",
    label: "PENDING",
  },
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.15, ease: "easeInOut" as const },
});

function PillarCard({
  pillar,
  flags: pillarFlags,
  isFull,
}: {
  pillar: RankedPillar;
  flags: AnalysisFlag[];
  isFull: boolean;
}) {
  const sc = STATUS_CONFIG[pillar.status];
  const icon = PILLAR_ICONS[pillar.key];
  const isDominant = pillar.tier === "dominant";
  const isSafe = pillar.tier === "safe";

  // Gap indicator text
  const gapText =
    pillar.gap != null && pillar.gap > 0
      ? `${pillar.gap} pts below county avg`
      : pillar.gap === 0
        ? "Meets county standard"
        : null;

  // Card classes based on tier
  const cardClass = isDominant ? "card-dominant" : isSafe ? "section-recessed" : "card-raised";

  const redFlags = pillarFlags.filter((f) => f.severity === "red");
  const amberFlags = pillarFlags.filter((f) => f.severity === "amber");

  return (
    <motion.div
      {...stagger(pillar.rank + 1)}
      className={`${cardClass} relative overflow-hidden`}
      style={{
        border: isDominant ? `2px solid ${sc.border}` : `1px solid ${sc.border}`,
        padding: isDominant ? "20px 20px 20px 24px" : "16px",
        opacity: isSafe ? 0.85 : 1,
      }}
    >
      {/* Left accent for dominant */}
      {isDominant && (
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: 3,
            background: sc.color,
            boxShadow: `0 0 8px ${sc.color}`,
          }}
        />
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          style={{
            color: sc.color,
            opacity: isSafe ? 0.5 : 1,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="font-body text-foreground"
              style={{
                fontSize: isDominant ? 16 : 14,
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {pillar.label}
            </span>

            <span
              className="font-mono"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: sc.color,
                letterSpacing: "0.08em",
                background: sc.bg,
                padding: "2px 8px",
                borderRadius: "var(--radius-btn)",
              }}
            >
              {sc.label}
            </span>
          </div>

          {/* Score + gap */}
          {isFull && pillar.score != null && (
            <div className="flex items-center gap-3 mb-2">
              {/* Mini donut */}
              <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={sc.color}
                    strokeWidth="3"
                    strokeDasharray={`${(pillar.score / 100) * 87.96} 87.96`}
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className="font-mono"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: sc.color,
                  }}
                >
                  {pillar.score}
                </span>
              </div>

              {/* Gap indicator */}
              {gapText && (
                <span className="font-mono text-muted-foreground" style={{ fontSize: 11 }}>
                  {gapText}
                </span>
              )}
            </div>
          )}

          {/* Flag summary for non-full or safe tier */}
          {!isDominant && (redFlags.length > 0 || amberFlags.length > 0) && (
            <p className="font-body text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>
              {redFlags.length > 0 && (
                <span style={{ color: "hsl(var(--color-danger))" }}>{redFlags.length} critical</span>
              )}
              {redFlags.length > 0 && amberFlags.length > 0 && " · "}
              {amberFlags.length > 0 && (
                <span style={{ color: "hsl(var(--color-caution))" }}>{amberFlags.length} caution</span>
              )}
            </p>
          )}

          {/* Dominant: expanded detail with tactical icon */}
          {isDominant && isFull && redFlags.length > 0 && (
            <div
              className="section-recessed mt-3"
              style={{
                background: "hsl(var(--secondary))",
                border: "1px solid hsl(var(--border) / 0.6)",
                borderRadius: "var(--radius-input)",
                padding: "12px 14px",
              }}
            >
              <div className="flex items-start gap-2">
                <ShieldAlert size={14} style={{ color: "hsl(var(--color-danger))", marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p
                    className="font-mono"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "hsl(var(--color-danger))",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    TOP ISSUE IN THIS PILLAR
                  </p>
                  <p className="font-body text-foreground" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                    {redFlags[0].label}
                  </p>
                  <p
                    className="font-body text-muted-foreground capitalize"
                    style={{ fontSize: 12, lineHeight: 1.5, marginTop: 2 }}
                  >
                    {redFlags[0].detail}
                  </p>
                  {redFlags[0].tip && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <MessageSquare
                        size={12}
                        style={{ color: "hsl(var(--color-gold-accent))", marginTop: 2, flexShrink: 0 }}
                      />
                      <p
                        className="font-body"
                        style={{ fontSize: 12, color: "hsl(var(--color-gold-accent))", lineHeight: 1.4 }}
                      >
                        {redFlags[0].tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ForensicPillarSection({ pillarScores, flags, county, isFull }: ForensicPillarSectionProps) {
  const ranked = rankPillars(pillarScores, flags);
  const hasProblem = ranked.some((p) => p.status === "fail" || p.status === "warn");

  return (
    <section className="py-10 md:py-14 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div {...stagger(1)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="wm-eyebrow" style={{ color: "hsl(var(--color-cyan))" }}>
              5-PILLAR ANALYSIS
            </span>
          </div>
          <h2 className="wm-title-section text-foreground" style={{ marginBottom: 6 }}>
            How Your Quote Scores Across 5 Key Areas
          </h2>
          <p className="font-body text-muted-foreground" style={{ fontSize: 14, marginBottom: 20 }}>
            Each Pillar is Scored Independently Against {county} County Standards.
          </p>
        </motion.div>

        {/* ── Verdict Position Bar ── */}
        <motion.div {...stagger(1.5)} className="mb-8">
          <VerdictPositionBar pillars={ranked} />
        </motion.div>

        {/* ── Ranked Pillar Cards ── */}
        <div className="relative">
          {/* Rank 1 — always visible */}
          <div className="flex flex-col gap-3">
            {ranked.slice(0, 1).map((p) => (
              <PillarCard key={p.key} pillar={p} flags={flags.filter((f) => f.pillar === p.key)} isFull={isFull} />
            ))}
          </div>

          {/* Ranks 2–5 — blurred pre-OTP */}
          <div className="relative mt-3">
            <div className={`flex flex-col gap-3 ${!isFull ? "blur-[3px] select-none pointer-events-none" : ""}`}>
              {ranked.slice(1).map((p) => (
                <PillarCard key={p.key} pillar={p} flags={flags.filter((f) => f.pillar === p.key)} isFull={isFull} />
              ))}
            </div>

            {/* Unlock overlay */}
            {!isFull && hasProblem && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
                <div
                  className="card-raised flex items-center gap-2"
                  style={{
                    padding: "10px 20px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card) / 0.95)",
                  }}
                >
                  <Lock size={14} className="text-muted-foreground" />
                  <span className="font-mono text-muted-foreground" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                    Unlock To See {ranked.length - 1} More Areas
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
