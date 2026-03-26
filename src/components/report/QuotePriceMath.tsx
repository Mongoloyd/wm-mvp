/**
 * QuotePriceMath — Financial Intelligence Cards
 * 4-card layout: True Total · Unit Economics · Cost Share · Transparency Index
 * Post-OTP only. Uses section-recessed background.
 */

import { motion } from "framer-motion";
import { AlertTriangle, DollarSign, BarChart3, Eye, TrendingDown } from "lucide-react";
import { formatCurrency, formatPct } from "@/utils/formatCurrency";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DerivedMetrics {
  totals: {
    contract_total: number | null;
    core_product_subtotal: number | null;
    install_like_subtotal: number | null;
    accessory_subtotal: number | null;
    discount_subtotal: number | null;
    tax_subtotal: number | null;
  };
  per_opening: {
    contract_price_per_opening: number | null;
    core_product_price_per_opening: number | null;
    installed_price_per_opening: number | null;
    non_core_cost_per_opening: number | null;
  };
  counts: {
    total_openings: number | null;
    window_openings: number | null;
    door_openings: number | null;
  };
  unit_pricing?: {
    window_avg_unit_price?: number | null;
    door_avg_unit_price?: number | null;
    median_core_line_price?: number | null;
    highest_priced_opening?: number | null;
    lowest_priced_opening?: number | null;
    price_spread_ratio?: number | null;
  };
  shares: {
    install_cost_share_pct: number | null;
    accessory_cost_share_pct: number | null;
    permit_cost_share_pct: number | null;
    discount_share_pct: number | null;
    tax_share_pct?: number | null;
  };
  coverage: {
    priced_line_coverage_pct: number | null;
    brand_coverage_pct: number | null;
    dp_coverage_pct: number | null;
    noa_coverage_pct: number | null;
  };
  diagnostics: {
    quote_math_confidence: number;
    warnings: string[];
  };
}

interface QuotePriceMathProps {
  metrics: DerivedMetrics;
  county: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
});

function NotDisclosed({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "hsl(var(--color-gold-accent))" }} />
      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(var(--color-gold-accent))" }}>
        {label || "DATA NOT DISCLOSED"}
      </span>
    </div>
  );
}

// ── Cost Share Bar ───────────────────────────────────────────────────────────

interface ShareSegment {
  label: string;
  pct: number | null;
  color: string;
}

function CostShareBar({ segments }: { segments: ShareSegment[] }) {
  // Filter segments with data
  const filled = segments.filter((s) => s.pct !== null && s.pct > 0);
  const undisclosed = segments.filter((s) => s.pct === null);
  const totalPct = filled.reduce((sum, s) => sum + (s.pct ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="w-full h-5 rounded-full overflow-hidden flex" style={{ background: "hsl(var(--secondary))" }}>
        {filled.map((s, i) => {
          const widthPct = totalPct > 0 ? ((s.pct ?? 0) / totalPct) * 100 : 0;
          return (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${widthPct}%` }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
              style={{ background: s.color }}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {filled.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="font-body text-xs text-muted-foreground">{s.label}</span>
            <span className="font-mono text-xs text-foreground">{formatPct(s.pct)}</span>
          </div>
        ))}
        {undisclosed.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm border border-dashed" style={{ borderColor: "hsl(var(--color-gold-accent) / 0.5)" }} />
            <span className="font-body text-xs text-muted-foreground">{s.label}</span>
            <NotDisclosed label="N/A" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Transparency Meter ───────────────────────────────────────────────────────

function TransparencyMeter({ score }: { score: number }) {
  const tier =
    score >= 80 ? { label: "HIGH", color: "hsl(var(--color-emerald))" } :
    score >= 50 ? { label: "MODERATE", color: "hsl(var(--color-caution))" } :
                  { label: "LOW", color: "hsl(var(--color-danger))" };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-2xl font-bold" style={{ color: tier.color }}>{formatPct(score)}</span>
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: tier.color }}>{tier.label} TRANSPARENCY</span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--secondary))" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: tier.color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ── Coverage Chip ────────────────────────────────────────────────────────────

function CoverageChip({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ background: "hsl(var(--color-gold-accent) / 0.08)", border: "1px solid hsl(var(--color-gold-accent) / 0.2)" }}>
        <AlertTriangle className="w-3 h-3" style={{ color: "hsl(var(--color-gold-accent))" }} />
        <span className="font-body text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  const color =
    value >= 80 ? "hsl(var(--color-emerald))" :
    value >= 50 ? "hsl(var(--color-caution))" :
                  "hsl(var(--color-danger))";

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary">
      <span className="font-body text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold" style={{ color }}>{formatPct(value)}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function QuotePriceMath({ metrics, county }: QuotePriceMathProps) {
  const { totals, per_opening, counts, shares, coverage, diagnostics, unit_pricing } = metrics;

  // Compute transparency index as average of available coverage values
  const coverageValues = [
    coverage.priced_line_coverage_pct,
    coverage.brand_coverage_pct,
    coverage.dp_coverage_pct,
    coverage.noa_coverage_pct,
  ].filter((v): v is number => v !== null && Number.isFinite(v));

  const transparencyScore = coverageValues.length > 0
    ? Math.round(coverageValues.reduce((s, v) => s + v, 0) / coverageValues.length)
    : 0;

  // Cost share segments
  const materialPct =
    totals.contract_total && totals.core_product_subtotal
      ? Math.round((totals.core_product_subtotal / totals.contract_total) * 100)
      : null;

  const costShareSegments: ShareSegment[] = [
    { label: "Materials", pct: materialPct, color: "hsl(var(--primary))" },
    { label: "Labor & Install", pct: shares.install_cost_share_pct, color: "hsl(var(--color-emerald))" },
    { label: "Fees & Permits", pct: shares.permit_cost_share_pct, color: "hsl(var(--color-gold-accent))" },
  ];

  return (
    <section className="py-10 md:py-14 px-4 md:px-8 section-recessed bg-secondary/40 border-y border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div {...stagger(0)}>
          <span className="wm-eyebrow" style={{ color: "hsl(var(--primary))" }}>FINANCIAL INTELLIGENCE</span>
          <h2 className="wm-title-section text-foreground mt-1 mb-8">Quote Price Math</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── Card 1: True Total ── */}
          <motion.div {...stagger(1)} className="card-raised p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="wm-eyebrow" style={{ color: "hsl(var(--primary))" }}>ADJUSTED CONTRACT TOTAL</span>
            </div>

            {totals.contract_total !== null ? (
              <>
                <p className="font-mono text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {formatCurrency(totals.contract_total)}
                </p>
                {counts.total_openings !== null && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="font-mono text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                      {counts.total_openings} opening{counts.total_openings !== 1 ? "s" : ""}
                    </span>
                    {counts.window_openings !== null && counts.window_openings > 0 && (
                      <span className="font-mono text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                        {counts.window_openings} window{counts.window_openings !== 1 ? "s" : ""}
                      </span>
                    )}
                    {counts.door_openings !== null && counts.door_openings > 0 && (
                      <span className="font-mono text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                        {counts.door_openings} door{counts.door_openings !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
                {diagnostics.warnings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {diagnostics.warnings.map((w, i) => (
                      <p key={i} className="font-mono text-[10px] text-muted-foreground/70 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--color-gold-accent))" }} />
                        {w}
                      </p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NotDisclosed label="TOTAL NOT EXTRACTED" />
            )}
          </motion.div>

          {/* ── Card 2: Unit Economics ── */}
          <motion.div {...stagger(2)} className="card-raised p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="wm-eyebrow" style={{ color: "hsl(var(--primary))" }}>PRICE PER OPENING</span>
            </div>

            {per_opening.contract_price_per_opening !== null ? (
              <>
                <p className="font-mono text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {formatCurrency(per_opening.contract_price_per_opening)}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">blended avg per opening</p>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-xs text-muted-foreground">Product Only</span>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {per_opening.core_product_price_per_opening !== null
                        ? formatCurrency(per_opening.core_product_price_per_opening)
                        : <NotDisclosed label="N/A" />}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-xs text-muted-foreground">Installed</span>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {per_opening.installed_price_per_opening !== null
                        ? formatCurrency(per_opening.installed_price_per_opening)
                        : <NotDisclosed label="N/A" />}
                    </span>
                  </div>
                  {unit_pricing?.window_avg_unit_price != null && (
                    <div className="flex justify-between items-center">
                      <span className="font-body text-xs text-muted-foreground">Window Avg</span>
                      <span className="font-mono text-sm text-foreground">{formatCurrency(unit_pricing.window_avg_unit_price)}</span>
                    </div>
                  )}
                  {unit_pricing?.door_avg_unit_price != null && (
                    <div className="flex justify-between items-center">
                      <span className="font-body text-xs text-muted-foreground">Door Avg</span>
                      <span className="font-mono text-sm text-foreground">{formatCurrency(unit_pricing.door_avg_unit_price)}</span>
                    </div>
                  )}
                </div>

                {/* County benchmark placeholder */}
                <div className="mt-4 px-3 py-2 rounded-md" style={{ background: "hsl(var(--color-cyan) / 0.08)", border: "1px solid hsl(var(--color-cyan) / 0.2)" }}>
                  <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "hsl(var(--color-cyan))" }}>
                    {county.toUpperCase()} COUNTY BENCHMARK — COMING SOON
                  </span>
                </div>
              </>
            ) : (
              <NotDisclosed label="PER-OPENING DATA UNAVAILABLE" />
            )}
          </motion.div>

          {/* ── Card 3: Cost Share Breakdown ── */}
          <motion.div {...stagger(3)} className="card-raised p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="wm-eyebrow" style={{ color: "hsl(var(--primary))" }}>COST SHARE BREAKDOWN</span>
            </div>

            <CostShareBar segments={costShareSegments} />

            {/* Discount & tax callouts */}
            <div className="mt-4 flex flex-wrap gap-2">
              {shares.discount_share_pct !== null && shares.discount_share_pct > 0 && (
                <span className="font-mono text-[11px] px-2 py-1 rounded-md" style={{ background: "hsl(var(--color-emerald) / 0.08)", color: "hsl(var(--color-emerald))" }}>
                  Discount: {formatPct(shares.discount_share_pct)}
                </span>
              )}
              {shares.tax_share_pct !== null && shares.tax_share_pct > 0 && (
                <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                  Tax: {formatPct(shares.tax_share_pct)}
                </span>
              )}
              {shares.accessory_cost_share_pct !== null && shares.accessory_cost_share_pct > 0 && (
                <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                  Accessories: {formatPct(shares.accessory_cost_share_pct)}
                </span>
              )}
            </div>
          </motion.div>

          {/* ── Card 4: Transparency Index ── */}
          <motion.div {...stagger(4)} className="card-raised p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-primary" />
              <span className="wm-eyebrow" style={{ color: "hsl(var(--primary))" }}>TRANSPARENCY INDEX</span>
            </div>

            <TransparencyMeter score={transparencyScore} />

            <div className="mt-4 flex flex-wrap gap-2">
              <CoverageChip label="Pricing" value={coverage.priced_line_coverage_pct} />
              <CoverageChip label="Brands" value={coverage.brand_coverage_pct} />
              <CoverageChip label="DP Ratings" value={coverage.dp_coverage_pct} />
              <CoverageChip label="NOA #s" value={coverage.noa_coverage_pct} />
            </div>

            {/* Math confidence */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-body text-[11px] text-muted-foreground">Math Confidence</span>
                <span className="font-mono text-xs font-semibold" style={{
                  color: diagnostics.quote_math_confidence >= 80
                    ? "hsl(var(--color-emerald))"
                    : diagnostics.quote_math_confidence >= 50
                    ? "hsl(var(--color-caution))"
                    : "hsl(var(--color-danger))",
                }}>
                  {diagnostics.quote_math_confidence}/100
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
