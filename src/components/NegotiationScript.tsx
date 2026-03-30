import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Shield, ChevronDown, ChevronUp } from "lucide-react";
 
interface TalkingPoint {
  issue: string;
  what_to_say: string;
  leverage: string;
  expected_savings: string;
}
 
interface NegotiationScriptData {
  opening_statement: string;
  talking_points: TalkingPoint[];
  closing_power_statement: string;
  confidence_level: "strong" | "moderate" | "limited";
  confidence_note: string;
  estimated_total_savings_range: string;
}
 
interface Props {
  script: NegotiationScriptData;
  isLoading?: boolean;
}
 
export function NegotiationScript({ script, isLoading }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
 
  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
 
  const copyFullScript = () => {
    const full = [
      `OPENING: ${script.opening_statement}`,
      "",
      ...script.talking_points.map(
        (tp, i) =>
          `POINT ${i + 1}: ${tp.issue}\nSAY: "${tp.what_to_say}"\nLEVERAGE: ${tp.leverage}\nSAVINGS: ${tp.expected_savings}`
      ),
      "",
      `CLOSING: ${script.closing_power_statement}`,
    ].join("\n\n");
    navigator.clipboard.writeText(full);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
 
  const confidenceColor =
    script.confidence_level === "strong"
      ? "text-emerald-500"
      : script.confidence_level === "moderate"
      ? "text-amber-500"
      : "text-slate-400";
 
  if (isLoading) {
    return (
      <div className="border border-primary/20 bg-primary/[0.03] p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-primary tracking-wide">
            GENERATING YOUR NEGOTIATION SCRIPT...
          </span>
        </div>
      </div>
    );
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="border border-primary/30 bg-primary/[0.03] mb-8"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-primary/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <span className="font-mono text-[10px] tracking-[0.12em] text-primary font-bold">
              YOUR NEGOTIATION SCRIPT
            </span>
          </div>
          <button
            onClick={copyFullScript}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
            {copiedIndex === -1 ? "Copied!" : "Copy All"}
          </button>
        </div>
 
        {script.estimated_total_savings_range && (
          <div className="text-sm text-foreground font-semibold mb-1">
            Estimated savings: {script.estimated_total_savings_range}
          </div>
        )}
        <div className={`text-xs font-mono ${confidenceColor}`}>
          Negotiating position: {script.confidence_level?.toUpperCase()} — {script.confidence_note}
        </div>
      </div>
 
      {/* Opening Statement */}
      <div className="px-6 py-4 border-b border-primary/10 bg-primary/[0.02]">
        <div className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground mb-2">
          OPENING STATEMENT
        </div>
        <p className="text-sm text-foreground leading-relaxed italic">
          "{script.opening_statement}"
        </p>
      </div>
 
      {/* Talking Points */}
      {script.talking_points.map((tp, i) => (
        <div key={i} className="border-b border-primary/10">
          <button
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-primary/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-primary font-bold w-5">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {tp.issue}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {tp.expected_savings && (
                <span className="font-mono text-xs text-emerald-500 font-semibold">
                  {tp.expected_savings}
                </span>
              )}
              {expandedIndex === i ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </div>
          </button>
 
          {expandedIndex === i && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4"
            >
              <div className="pl-8 space-y-3">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.1em] text-gold mb-1">
                    WHAT TO SAY
                  </div>
                  <p className="text-sm text-foreground leading-relaxed bg-gold/[0.04] border border-gold/20 p-3 italic">
                    "{tp.what_to_say}"
                  </p>
                  <button
                    onClick={() => copyText(tp.what_to_say, i)}
                    className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copiedIndex === i ? (
                      <><Check size={12} /> Copied</>
                    ) : (
                      <><Copy size={12} /> Copy this line</>
                    )}
                  </button>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground mb-1">
                    WHY THIS WORKS
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tp.leverage}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      ))}
 
      {/* Closing Statement */}
      <div className="px-6 py-4 bg-primary/[0.02]">
        <div className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground mb-2">
          CLOSING POWER STATEMENT
        </div>
        <p className="text-sm text-foreground leading-relaxed font-semibold">
          "{script.closing_power_statement}"
        </p>
      </div>
    </motion.div>
  );
}
