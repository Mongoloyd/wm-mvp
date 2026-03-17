import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";

interface StickyRecoveryBarProps { stepsCompleted: number; county: string; isVisible: boolean; onDismiss: () => void; flowMode?: 'A' | 'B'; flowBLeadCaptured?: boolean; quoteWatcherSet?: boolean; onDemoCTAClick?: () => void; leadCaptured?: boolean; isDevMode?: boolean; gradeRevealed?: boolean; onContractorMatchClick?: () => void; }

const getStatusCopy = (steps: number, flowMode: string, flowBLeadCaptured: boolean) => {
  if (flowMode === 'B') { if (!flowBLeadCaptured) return { line1: "Your baseline is being configured.", line2: "Takes less than a minute." }; return { line1: "Set your quote reminder to complete Flow B.", line2: "Your analysis is waiting." }; }
  switch (steps) { case 0: return { line1: "Your scan is ready to configure.", line2: "Learn how to spot a bad deal." }; case 1: return { line1: "You answered 1 of 4 questions.", line2: "Takes less than a minute to finish." }; case 2: return { line1: "You're halfway through your scan.", line2: "Takes less than a minute to finish." }; case 3: return { line1: "One question left before your grade.", line2: "Your analysis is waiting." }; default: return { line1: "Your scan is configured — enter your details.", line2: "Your analysis is waiting." }; }
};
const getCtaText = (steps: number, flowMode: string, flowBLeadCaptured: boolean) => { if (flowMode === 'B') { if (!flowBLeadCaptured) return "Continue to Baseline →"; return "Set My Reminder →"; } if (steps === 0) return "Start My Scan →"; if (steps >= 4) return "Unlock My Grade →"; return "Continue My Scan →"; };
const getCtaTarget = (flowMode: string, flowBLeadCaptured: boolean) => { if (flowMode === 'B') return flowBLeadCaptured ? "quote-watcher" : "market-baseline"; return "truth-gate"; };

const StickyRecoveryBar = ({ stepsCompleted, county, isVisible, onDismiss, flowMode = 'A', flowBLeadCaptured = false, quoteWatcherSet = false, onDemoCTAClick, leadCaptured = false, isDevMode = false, gradeRevealed = false, onContractorMatchClick }: StickyRecoveryBarProps) => {
  const [isUrgent, setIsUrgent] = useState(false);
  const controls = useAnimationControls();
  const lastScrollY = useRef(0);

  useEffect(() => { if (!isVisible) return; const timer = setTimeout(() => { if (stepsCompleted > 0) setIsUrgent(true); }, 150000); return () => clearTimeout(timer); }, [isVisible, stepsCompleted]);

  if (!isDevMode && flowMode === 'B' && quoteWatcherSet) return null;

  const { line1, line2 } = getStatusCopy(stepsCompleted, flowMode, flowBLeadCaptured);
  const postReveal = gradeRevealed;
  const displayLine1 = postReveal ? "Your grade report is ready." : line1;
  const displayCta = postReveal ? "Find a Contractor →" : getCtaText(stepsCompleted, flowMode, flowBLeadCaptured);

  const handleCta = () => {
    if (gradeRevealed && onContractorMatchClick) { onContractorMatchClick(); return; }
    const target = getCtaTarget(flowMode, flowBLeadCaptured);
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8000 }}>
          <div style={{ background: "#FFFFFF", borderTop: `2px solid ${isUrgent && flowMode === 'A' && !postReveal ? "#DC2626" : "#C8952A"}`, boxShadow: "0 -4px 24px rgba(15, 31, 53, 0.14)" }} className="px-5 py-3.5 sm:px-8 sm:py-4">
            <div className="max-w-4xl mx-auto flex flex-nowrap items-center justify-between gap-4 relative">
              <div className="hidden sm:flex items-center gap-3.5 min-w-0 flex-shrink">
                <div className="min-w-0"><p className="whitespace-nowrap truncate" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "#0F1F35" }}>{displayLine1}</p></div>
              </div>
              <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-center sm:justify-end">
                <button onClick={handleCta} style={{ background: "#C8952A", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 8, border: "none", boxShadow: "0 2px 10px rgba(200,149,42,0.3)", cursor: "pointer", whiteSpace: "nowrap" }}>{displayCta}</button>
                <button onClick={() => { if (!isDevMode) localStorage.setItem("wm_recovery_bar_dismissed", "true"); onDismiss(); }} style={{ background: "transparent", border: "none", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 16, cursor: "pointer" }} aria-label="Dismiss">×</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyRecoveryBar;
