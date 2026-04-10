import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { resolveEffectiveSeverity } from "@/utils/resolveEffectiveSeverity";
import type { AnalysisFlag } from "@/hooks/useAnalysisData";

interface RiskSummaryHeaderProps {
  flags: AnalysisFlag[];
  flagRedCount?: number;
  flagAmberCount?: number;
  accessLevel: "preview" | "full";
}

const RiskSummaryHeader = ({
  flags,
  flagRedCount: flagRedCountProp,
  flagAmberCount: flagAmberCountProp,
  accessLevel,
}: RiskSummaryHeaderProps) => {
  const isFull = accessLevel === "full";

  // Preview mode: use raw count props only.
  // Full mode: compute from flags using resolveEffectiveSeverity.
  const red = isFull
    ? flags.filter((f) => resolveEffectiveSeverity(f) === "red").length
    : (flagRedCountProp ?? 0);
  const amber = isFull
    ? flags.filter((f) => resolveEffectiveSeverity(f) === "amber").length
    : (flagAmberCountProp ?? 0);

  const config = red > 0
    ? {
        verdict: `High Risk Detected: ${red} critical issue${red !== 1 ? "s" : ""} ${red === 1 ? "leaves" : "leave"} you exposed.`,
        Icon: ShieldAlert,
        color: "hsl(var(--color-danger))",
        bg: "hsl(var(--color-danger) / 0.06)",
        borderColor: "hsl(var(--color-danger) / 0.25)",
      }
    : amber > 0
    ? {
        verdict: `Proceed with Caution: ${amber} protection${amber !== 1 ? "s are" : " is"} missing.`,
        Icon: AlertTriangle,
        color: "hsl(var(--color-caution))",
        bg: "hsl(var(--color-caution) / 0.06)",
        borderColor: "hsl(var(--color-caution) / 0.25)",
      }
    : {
        verdict: "Clear & Transparent: This estimate follows best practices.",
        Icon: ShieldCheck,
        color: "hsl(var(--color-emerald))",
        bg: "hsl(var(--color-emerald) / 0.06)",
        borderColor: "hsl(var(--color-emerald) / 0.25)",
      };

  const { verdict, Icon, color, bg, borderColor } = config;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: 0.1 }}
      className="py-4 px-4 md:px-8"
      style={{ background: bg, borderBottom: `1.5px solid ${borderColor}` }}
    >
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <Icon size={22} style={{ color, flexShrink: 0 }} strokeWidth={2} />
        <p className="font-body text-foreground capitalize" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
          {verdict}
        </p>
      </div>
    </motion.section>
  );
};

export default RiskSummaryHeader;
