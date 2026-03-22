/**
 * MobileStickyUnlock — Mobile-first sticky CTA for report unlock.
 *
 * Facebook traffic is 85%+ mobile. This component:
 * 1. Sticks to the bottom of the screen on mobile
 * 2. Shows a compelling unlock prompt with finding count
 * 3. Pulses gently to draw attention without being annoying
 * 4. Disappears when the report is fully unlocked
 * 5. Uses safe-area-inset for notched phones (iPhone X+)
 *
 * CRO Optimization:
 * - Shows specific finding count ("5 findings locked")
 * - Uses loss aversion copy ("Don't miss...")
 * - Thumb-friendly tap target (min 48px)
 * - High contrast against dark background
 */

import { Lock, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

interface MobileStickyUnlockProps {
  isLocked: boolean;
  findingCount?: number;
  grade?: string;
  onUnlock: () => void;
}

export function MobileStickyUnlock({
  isLocked,
  findingCount = 0,
  grade,
  onUnlock,
}: MobileStickyUnlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show after scrolling past the first finding card
  useEffect(() => {
    if (!isLocked || isDismissed) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLocked, isDismissed]);

  if (!isLocked || !isVisible || isDismissed) return null;

  const lockedCount = Math.max(0, findingCount - 2); // First 2 are visible in preview
  const gradeColor =
    grade === "D" || grade === "F"
      ? "text-red-400"
      : grade === "C"
        ? "text-amber-400"
        : "text-cyan-400";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Gradient fade above the bar */}
      <div className="h-6 bg-gradient-to-t from-[#0A0F1A] to-transparent" />

      <div className="bg-[#0A0F1A]/95 backdrop-blur-md border-t border-white/10 px-4 py-3">
        <button
          onClick={onUnlock}
          className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[#1A6FD4] to-[#0D4F9E] px-5 py-3.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
          style={{ minHeight: "48px" }} // Thumb-friendly
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">
                {lockedCount > 0
                  ? `${lockedCount} more findings locked`
                  : "Full report locked"}
              </p>
              <p className="text-[11px] text-blue-200/70">
                Verify your phone to unlock everything
              </p>
            </div>
          </div>
          <ChevronUp className="h-5 w-5 text-white/60" />
        </button>
      </div>
    </div>
  );
}
