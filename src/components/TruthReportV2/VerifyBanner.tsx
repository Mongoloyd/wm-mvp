/**
 * VerifyBanner — Prominent gold-bordered block below verdict.
 * CTA opens PhoneVerifyModal.
 */

import React from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";

interface VerifyBannerProps {
  onVerifyClick: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay: 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export function VerifyBanner({ onVerifyClick }: VerifyBannerProps) {
  return (
    <motion.div
      {...fadeUp}
      className="mb-10 border border-gold/40 bg-gold/[0.04] px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Lock size={13} className="text-gold" />
          <span className="font-mono text-[10px] tracking-[0.12em] text-gold font-bold">
            YOUR FULL REPORT IS READY
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Verify your phone number to unlock all findings, detailed analysis, and your negotiation script.
        </p>
      </div>

      <button
        onClick={onVerifyClick}
        className="shrink-0 flex items-center justify-center gap-2 bg-gold text-[#0D0D0D] px-5 py-3 text-sm font-bold transition-[box-shadow] hover:shadow-[0_6px_24px_hsl(var(--gold)/0.35)] active:scale-[0.97]"
      >
        Verify & Unlock Report
        <ArrowRight size={15} />
      </button>
    </motion.div>
  );
}
