import { useState, useEffect } from "react";
import { Phone } from "lucide-react";

interface StickyCTAFooterProps {
  onScanClick: () => void;
  onDemoClick: () => void;
  onPostConversionClick: () => void;
  isVisible: boolean;
  conversionType: 'scan' | 'account' | null;
}

export const StickyCTAFooter = ({ onScanClick, onDemoClick, onPostConversionClick, isVisible, conversionType }: StickyCTAFooterProps) => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimeout); };
  }, []);

  if (!isVisible) return null;

  const postConversionText = conversionType === 'account'
    ? "Request a Free Estimate"
    : conversionType === 'scan'
    ? "Get Answers About Your Grade"
    : null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg p-3 px-4 transition-opacity duration-300 ${isScrolling ? 'opacity-25 hover:opacity-100' : 'opacity-100'}`}>
      <div className="max-w-4xl mx-auto flex items-center justify-center md:justify-between w-full">
        {conversionType ? (
          <div className="flex justify-center w-full">
            <button
              onClick={onPostConversionClick}
              className="w-full max-w-[280px] bg-[#C8952A] hover:bg-[#b58625] text-white font-semibold py-3 px-6 rounded-md transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              {postConversionText}
            </button>
          </div>
        ) : (
          <>
            <p className="hidden md:block text-sm font-medium text-foreground">
              Don't Sign Until You've Got Your Free WindowMan AI Truth Report →
            </p>
            <div className="flex justify-center gap-3 w-full md:w-auto">
              <button
                onClick={onScanClick}
                className="flex-1 md:flex-none w-full max-w-[200px] bg-[#C8952A] hover:bg-[#b58625] text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm sm:text-base"
              >
                Scan My Quote
              </button>
              <button
                onClick={onDemoClick}
                className="flex-1 md:flex-none w-full max-w-[200px] bg-[#22B6CB] hover:bg-[#1da3b8] text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm sm:text-base"
              >
                Watch Live Demo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StickyCTAFooter;
