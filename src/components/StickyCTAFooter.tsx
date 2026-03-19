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
    let scrollTimeout: ReturnType<typeof setTimeout>;
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
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur p-3 px-4 transition-opacity duration-150 ${isScrolling ? 'opacity-25 hover:opacity-100' : 'opacity-100'}`}
      style={{ backgroundColor: "rgba(10,10,10,0.95)", borderTop: "1px solid #1A1A1A" }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-center md:justify-between w-full">
        {conversionType ? (
          <div className="flex justify-center w-full">
            <button
              onClick={onPostConversionClick}
              className="w-full max-w-[280px] flex items-center justify-center gap-2"
              style={{ backgroundColor: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, padding: "12px 24px", border: "none", cursor: "pointer" }}
            >
              <Phone size={18} />
              {postConversionText}
            </button>
          </div>
        ) : (
          <>
            <p className="hidden md:block text-sm font-medium" style={{ color: "#6B7280" }}>
              Don't Sign Until You've Got Your Free WindowMan AI Truth Report →
            </p>
            <div className="flex justify-center gap-3 w-full md:w-auto">
              <button
                onClick={onScanClick}
                className="flex-1 md:flex-none w-full max-w-[200px]"
                style={{ backgroundColor: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, padding: "12px 16px", border: "none", cursor: "pointer" }}
              >
                Scan My Quote
              </button>
              <button
                onClick={onDemoClick}
                className="flex-1 md:flex-none w-full max-w-[200px]"
                style={{ backgroundColor: "transparent", color: "#2563EB", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, padding: "12px 16px", border: "1px solid rgba(37,99,235,0.3)", cursor: "pointer" }}
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
