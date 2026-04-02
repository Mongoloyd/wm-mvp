import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, X } from "lucide-react";
import { getGapFixQuestions } from "@/utils/gapFixScripts";
import type { AnalysisFlag } from "@/hooks/useAnalysisData";

interface GapFixModuleProps {
  flags: AnalysisFlag[];
  onClose: () => void;
}

const GapFixModule = ({ flags, onClose }: GapFixModuleProps) => {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questions = getGapFixQuestions(flags);

  const fullText = questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join("\n");

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const scheduleCopiedReset = () => {
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      scheduleCopiedReset();
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = fullText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      scheduleCopiedReset();
    }
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
            border: "1.5px solid hsl(var(--color-caution) / 0.25)",
            background: "hsl(var(--card))",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: "hsl(var(--color-caution) / 0.06)",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <div>
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "hsl(var(--color-caution))",
                  letterSpacing: "0.08em",
                  marginBottom: 2,
                }}
              >
                GAP-FIX QUESTIONS
              </p>
              <p className="font-body text-muted-foreground" style={{ fontSize: 13 }}>
                Ask your contractor these questions before signing.
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

          {/* Questions */}
          <div className="px-6 py-5">
            <ol className="flex flex-col gap-3">
              {questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="font-mono flex-shrink-0"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "hsl(var(--color-caution))",
                      marginTop: 2,
                      minWidth: 20,
                    }}
                  >
                    {i + 1}.
                  </span>
                  <p className="font-body text-foreground/90" style={{ fontSize: 15, lineHeight: 1.6 }}>
                    {q}
                  </p>
                </li>
              ))}
            </ol>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 mt-5 border border-border"
              style={{
                background: copied ? "hsl(var(--color-emerald) / 0.12)" : "transparent",
                borderColor: copied ? "hsl(var(--color-emerald) / 0.3)" : undefined,
                borderRadius: "var(--radius-btn)",
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: copied ? "hsl(var(--color-emerald))" : "hsl(var(--foreground))",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy All Questions"}
            </button>

            {/* Disclaimer */}
            <p
              className="font-body text-muted-foreground"
              style={{ fontSize: 11, fontStyle: "italic", marginTop: 16, lineHeight: 1.6 }}
            >
              These are informational questions only — not legal advice. Use them to start a calm, productive conversation with your contractor.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default GapFixModule;
