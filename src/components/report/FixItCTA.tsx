import { motion } from "framer-motion";
import { Lock, FileText, HelpCircle, CheckSquare } from "lucide-react";

interface FixItCTAProps {
  redCount: number;
  amberCount: number;
  accessLevel: "preview" | "full";
  onGetGapFix: () => void;
  onGetGreenChecklist: () => void;
}

const FixItCTA = ({
  redCount,
  amberCount,
  accessLevel,
  onGetGapFix,
  onGetGreenChecklist,
}: FixItCTAProps) => {
  const isFull = accessLevel === "full";

  // Red state: non-clickable coming-soon div
  if (redCount > 0) {
    return (
      <section className="py-6 px-4 md:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl shadow-sm flex items-center justify-center gap-2 py-4 px-6 font-body"
            style={{
              background: "hsl(var(--color-danger) / 0.06)",
              border: "1.5px solid hsl(var(--color-danger) / 0.2)",
              color: "hsl(var(--color-danger))",
              fontSize: 15,
              fontWeight: 600,
              cursor: "default",
            }}
          >
            <FileText size={18} />
            Request for Proposal Tool (Coming Soon)
          </div>
        </div>
      </section>
    );
  }

  // Amber state: gap-fix CTA
  if (amberCount > 0) {
    const isLocked = !isFull;
    return (
      <section className="py-6 px-4 md:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.button
            whileHover={isLocked ? {} : { scale: 1.01 }}
            whileTap={isLocked ? {} : { scale: 0.99 }}
            onClick={isLocked ? undefined : onGetGapFix}
            disabled={isLocked}
            title={isLocked ? "Verify phone to unlock this tool." : undefined}
            className="rounded-2xl shadow-sm flex items-center justify-center gap-2 w-full py-4 px-6 font-body"
            style={{
              background: "hsl(var(--color-caution) / 0.08)",
              border: "1.5px solid hsl(var(--color-caution) / 0.25)",
              color: "hsl(var(--color-caution))",
              fontSize: 15,
              fontWeight: 600,
              cursor: isLocked ? "default" : "pointer",
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            {isLocked ? <Lock size={16} /> : <HelpCircle size={18} />}
            Get Gap-Fix Questions
          </motion.button>
        </div>
      </section>
    );
  }

  // Green state: checklist CTA — usable in both preview and full
  return (
    <section className="py-6 px-4 md:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onGetGreenChecklist}
          className="rounded-2xl shadow-sm flex items-center justify-center gap-2 w-full py-4 px-6 font-body"
          style={{
            background: "hsl(var(--color-emerald) / 0.08)",
            border: "1.5px solid hsl(var(--color-emerald) / 0.25)",
            color: "hsl(var(--color-emerald))",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <CheckSquare size={18} />
          Final Pre-Signature Checklist
        </motion.button>
      </div>
    </section>
  );
};

export default FixItCTA;
