import { Lock, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

interface MobileStickyUnlockProps {
  isLocked: boolean;
  findingCount?: number;
  grade?: string;
  onUnlock: () => void;
}

export function MobileStickyUnlock({ isLocked, findingCount = 0, grade, onUnlock }: MobileStickyUnlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isLocked || isDismissed) return;
    const handleScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLocked, isDismissed]);

  if (!isLocked || !isVisible || isDismissed) return null;

  const lockedCount = Math.max(0, findingCount - 2);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="h-6 bg-gradient-to-t from-background to-transparent" />
      <div className="glass-card backdrop-blur-md border-t border-border px-4 py-3">
        <button
          onClick={onUnlock}
          className="w-full flex items-center justify-between btn-depth-primary rounded-xl px-5 py-3.5 shadow-lg active:scale-[0.98] transition-transform"
          style={{ minHeight: "48px" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Lock className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-primary-foreground">
                {lockedCount > 0 ? `${lockedCount} more findings locked` : "Full report locked"}
              </p>
              <p className="text-[11px] text-primary-foreground/70">Verify your phone to unlock everything</p>
            </div>
          </div>
          <ChevronUp className="h-5 w-5 text-primary-foreground/60" />
        </button>
      </div>
    </div>
  );
}
