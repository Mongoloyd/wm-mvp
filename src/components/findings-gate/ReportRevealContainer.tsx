// ═══════════════════════════════════════════════════════════════════════════════
// REPORT REVEAL CONTAINER
// Orchestrates the visual transition from locked → unlocked.
// Uses Framer Motion for the premium feel.
//
// Install: npm install framer-motion
//
// If framer-motion is not available, this component degrades gracefully
// to CSS transitions (the motion.div becomes a regular div with
// Tailwind transition classes).
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";

interface ReportRevealContainerProps {
  isLocked: boolean;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}

export function ReportRevealContainer({
  isLocked,
  children,
  overlay,
}: ReportRevealContainerProps) {
  return (
    <div className="relative min-h-screen">
      {/* Layer 1: Report content — blurs/dims when locked, sharpens on unlock */}
      <motion.div
        initial={false}
        animate={{
          filter: isLocked ? "blur(6px)" : "blur(0px)",
          scale: isLocked ? 0.985 : 1,
          opacity: isLocked ? 0.55 : 1,
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1], // Material deceleration curve
        }}
        className="origin-top"
      >
        {/* Scroll lock when modal is open */}
        <div className={isLocked ? "overflow-hidden max-h-screen" : ""}>
          {children}
        </div>
      </motion.div>

      {/* Layer 2: OTP modal overlay — exits with blur + scale on success */}
      <AnimatePresence>
        {isLocked && overlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              filter: "blur(8px)",
            }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="fixed inset-0 z-50"
          >
            {overlay}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 3: Success glow flash — brief branded pulse on unlock */}
      <AnimatePresence>
        {!isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed inset-0 pointer-events-none z-40 bg-[#1A6FD4]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS-ONLY FALLBACK
// If framer-motion is not installed, use this instead.
// Replace the import at the top of FindingsPageShell.tsx:
//   import { ReportRevealContainerCSS as ReportRevealContainer } from "./ReportRevealContainer";
// ═══════════════════════════════════════════════════════════════════════════════

export function ReportRevealContainerCSS({
  isLocked,
  children,
  overlay,
}: ReportRevealContainerProps) {
  return (
    <div className="relative min-h-screen">
      {/* Layer 1: Report content */}
      <div
        className="origin-top transition-all duration-700 ease-out"
        style={{
          filter: isLocked ? "blur(6px)" : "blur(0px)",
          transform: isLocked ? "scale(0.985)" : "scale(1)",
          opacity: isLocked ? 0.55 : 1,
        }}
      >
        <div className={isLocked ? "overflow-hidden max-h-screen" : ""}>
          {children}
        </div>
      </div>

      {/* Layer 2: Overlay */}
      {isLocked && overlay && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
          {overlay}
        </div>
      )}
    </div>
  );
}
