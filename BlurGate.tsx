import { Lock } from "lucide-react";

interface BlurGateProps {
  children: React.ReactNode;
  locked: boolean;
  blurStrength?: number;
  onUnlock?: () => void;
  showLockIcon?: boolean;
}

export function BlurGate({
  children,
  locked,
  blurStrength = 6,
  onUnlock,
  showLockIcon = true,
}: BlurGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Blurred content — visible enough to build value, not readable enough to extract */}
      <div
        className="select-none pointer-events-none transition-all duration-700"
        style={{ filter: `blur(${blurStrength}px)` }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A0F1A] to-transparent pointer-events-none" />

      {/* Lock overlay (optional click target) */}
      {showLockIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onUnlock}
            className="
              flex items-center gap-2 rounded-xl
              bg-slate-900/80 backdrop-blur-sm
              px-5 py-3 ring-1 ring-white/10
              text-sm font-medium text-slate-300
              transition-all hover:bg-slate-800/90 hover:text-white hover:ring-white/20
              shadow-xl
            "
          >
            <Lock className="h-4 w-4" />
            Unlock with verification
          </button>
        </div>
      )}
    </div>
  );
}
