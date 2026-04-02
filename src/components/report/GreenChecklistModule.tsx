import { useState } from "react";
import { motion } from "framer-motion";
import { X, Square, CheckSquare } from "lucide-react";

interface GreenChecklistModuleProps {
  onClose: () => void;
}

const CHECKLIST_ITEMS = [
  "HOA Approval — Confirm your Homeowners Association has approved the project scope and product selections.",
  "Contractor-led Permitting — Verify the contractor is pulling all required building permits on your behalf.",
  "Less than 20% Deposit — Ensure the upfront deposit does not exceed 20% of the total contract price.",
  "Proof of Insurance — Request a copy of the contractor's general liability and workers' compensation insurance.",
];

const GreenChecklistModule = ({ onClose }: GreenChecklistModuleProps) => {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="py-6 px-4 md:px-8 bg-background"
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl shadow-sm"
          style={{
            border: "1.5px solid hsl(var(--color-emerald) / 0.25)",
            background: "hsl(var(--card))",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: "hsl(var(--color-emerald) / 0.06)",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <div>
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "hsl(var(--color-emerald))",
                  letterSpacing: "0.08em",
                  marginBottom: 2,
                }}
              >
                PRE-SIGNATURE CHECKLIST
              </p>
              <p className="font-body text-muted-foreground" style={{ fontSize: 13 }}>
                Standard due diligence before signing any contract.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Checklist */}
          <div className="px-6 py-5 flex flex-col gap-3">
            {CHECKLIST_ITEMS.map((item, i) => {
              const isChecked = checked.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleItem(i)}
                  className="flex items-start gap-3 w-full text-left"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span className="flex-shrink-0" style={{ marginTop: 1 }}>
                    {isChecked ? (
                      <CheckSquare size={18} style={{ color: "hsl(var(--color-emerald))" }} />
                    ) : (
                      <Square size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
                    )}
                  </span>
                  <p
                    className="font-body"
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: isChecked ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                      textDecoration: isChecked ? "line-through" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {item}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="px-6 pb-5">
            <p
              className="font-body text-muted-foreground"
              style={{ fontSize: 11, fontStyle: "italic", lineHeight: 1.6 }}
            >
              This is a general due diligence checklist — not verification of your specific contractor or quote.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default GreenChecklistModule;
