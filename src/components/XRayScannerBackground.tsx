import { ReactNode, useEffect, useRef, useState } from 'react';

interface XRayScannerBackgroundProps {
  children: ReactNode;
}

export function XRayScannerBackground({ children }: XRayScannerBackgroundProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track scroll position for scan bar
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Calculate progress: 0 when entering viewport, 1 when leaving
      const scrollStart = windowHeight;
      const scrollEnd = -sectionHeight;
      const scrollRange = scrollStart - scrollEnd;
      const scrollPosition = scrollStart - sectionTop;
      const progress = Math.max(0, Math.min(1, scrollPosition / scrollRange));
      
      setScanProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  const contractLines = [
    "ADMIN FEE – $1,950",
    "EMERGENCY RUSH – $3,200",
    "PERMIT PROCESSING – $875",
    "DISPOSAL FEE – $650",
    "WEEKEND SURCHARGE – $1,400",
    "CONSULTATION CHARGE – $550",
    "MATERIAL HANDLING – $925",
    "INSPECTION FEE – $780",
  ];

  const redFlags = [
    { top: '15%', left: '20%', label: '🚩 Markup 40%', delay: 0 },
    { top: '35%', left: '60%', label: '🚩 Junk Fee', delay: 0.2 },
    { top: '55%', left: '30%', label: '🚩 Double Counting', delay: 0.4 },
    { top: '75%', left: '70%', label: '🚩 Unnecessary', delay: 0.6 },
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden py-20 bg-gradient-to-br from-card/30 via-background to-card/30"
    >
      {/* Layer 1: Scrolling Contract Background (Desktop only) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none hidden md:block">
          <div className="animate-scroll-horizontal flex gap-8 whitespace-nowrap">
            {/* Duplicate for seamless loop */}
            {[...contractLines, ...contractLines].map((line, i) => (
              <div key={i} className="text-4xl font-mono text-foreground py-4">
                {line}
              </div>
            ))}
          </div>
          <div className="animate-scroll-horizontal-delayed flex gap-8 whitespace-nowrap mt-12">
            {[...contractLines, ...contractLines].map((line, i) => (
              <div key={i} className="text-4xl font-mono text-foreground py-4">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 2: Scan Bar (Scroll-triggered, Desktop only) */}
      {!prefersReducedMotion && (
        <div 
          className="absolute inset-x-0 h-24 pointer-events-none hidden md:block transition-all duration-200 ease-out"
          style={{ 
            top: `${scanProgress * 100}%`,
            background: 'linear-gradient(180deg, transparent 0%, hsl(var(--success) / 0.15) 30%, hsl(var(--success) / 0.25) 50%, hsl(var(--success) / 0.15) 70%, transparent 100%)',
            boxShadow: '0 0 60px hsl(var(--success) / 0.3)',
          }}
        >
          {/* Scan line effect */}
          <div className="w-full h-0.5 bg-success/60 absolute top-1/2 shadow-glow-success" />
          <div className="w-full h-px bg-success/30 absolute top-1/2 mt-1 animate-pulse" />
        </div>
      )}

      {/* Layer 3: Red Flag Markers (appear as scan bar passes, Desktop only) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          {redFlags.map((flag, i) => {
            const flagProgress = scanProgress * 100;
            const flagPosition = parseFloat(flag.top);
            const isVisible = flagProgress > flagPosition - 10 && flagProgress < flagPosition + 10;
            
            return (
              <div
                key={i}
                className="absolute transition-all duration-500 ease-out"
                style={{ 
                  top: flag.top, 
                  left: flag.left,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                  transitionDelay: `${flag.delay}s`
                }}
              >
                <div className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-glow-destructive border border-destructive">
                  {flag.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Foreground Content (Cards) */}
      <div className="relative z-10">
        {children}
      </div>

      <style>{`
        @keyframes scroll-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-scroll-horizontal {
          animation: scroll-horizontal 60s linear infinite;
        }

        .animate-scroll-horizontal-delayed {
          animation: scroll-horizontal 60s linear infinite;
          animation-delay: -30s;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-horizontal,
          .animate-scroll-horizontal-delayed {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
