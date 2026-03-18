import { Lock } from "lucide-react";

interface StickyCTAFooterProps {
  onScanClick: () => void;
  onDemoClick: () => void;
  isVisible: boolean;
}

export const StickyCTAFooter = ({ onScanClick, onDemoClick, isVisible }: StickyCTAFooterProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-[0_-10px_30px_rgba(0,0,0,0.1)] p-3 px-4 animate-in slide-in-from-bottom-10">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-2">
        <div className="flex flex-row w-full justify-center gap-3">
          <button
            onClick={onScanClick}
            className="flex-1 max-w-[240px] bg-[#22B6CB] hover:bg-[#1da3b8] text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm sm:text-base"
          >
            Scan My Quote
          </button>
          <button
            onClick={onDemoClick}
            className="flex-1 max-w-[240px] bg-[#C8952A] hover:bg-[#b58625] text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm sm:text-base"
          >
            Watch Live Demo
          </button>
        </div>
        <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-1">
          <Lock size={10} className="text-muted-foreground" />
          <span>256-bit Encrypted &middot; No Credit Card &middot; Results in 60s</span>
        </p>
      </div>
    </div>
  );
};

export default StickyCTAFooter;
