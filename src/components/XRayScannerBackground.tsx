import { ReactNode, useEffect, useRef, useState } from 'react';

interface XRayScannerBackgroundProps {
  children: ReactNode;
}

export function XRayScannerBackground({ children }: XRayScannerBackgroundProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      const scrollStart = windowHeight;
      const scrollEnd = -sectionHeight;
      const scrollRange = scrollStart - scrollEnd;
      const scrollPosition = scrollStart - sectionTop;
      const progress = Math.max(0, Math.min(1, scrollPosition / scrollRange));
      setScanProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
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
    "SITE ASSESSMENT – $1,100",
    "UPGRADE SURCHARGE – $2,400",
    "DEBRIS REMOVAL – $475",
    "SCHEDULING FEE – $350",
  ];

  const rowConfigs = [
    { speed: 40, delay: 0 },
    { speed: 55, delay: -20 },
    { speed: 45, delay: -10 },
    { speed: 60, delay: -35 },
    { speed: 42, delay: -5 },
    { speed: 58, delay: -28 },
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
      {/* Layer 1: Dense scrolling contract text */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none hidden md:block">
          {rowConfigs.map((cfg, rowIdx) => (
            <div
              key={rowIdx}
              className="flex gap-8 whitespace-nowrap"
              style={{
                animation: `scroll-horizontal ${cfg.speed}s linear infinite`,
                animationDelay: `${cfg.delay}s`,
                marginTop: rowIdx === 0 ? 0 : '1.5rem',
              }}
            >
              {[...contractLines, ...contractLines].map((line, i) => (
                <div key={i} className="text-3xl font-mono text-foreground py-3">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Layer 2: Scan Bar with bloom glow */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-x-0 pointer-events-none hidden md:block"
          style={{
            top: `${scanProgress * 100}%`,
            height: '12rem',
            background: 'linear-gradient(180deg, transparent 0%, rgba(74,222,128,0.15) 20%, rgba(74,222,128,0.25) 45%, rgba(74,222,128,0.3) 50%, rgba(74,222,128,0.25) 55%, rgba(74,222,128,0.15) 80%, transparent 100%)',
            boxShadow: '0 0 30px rgba(74,222,128,0.3), 0 0 60px rgba(74,222,128,0.2), 0 0 120px rgba(74,222,128,0.1)',
            transition: 'top 0.15s linear',
            animation: 'scan-pulse 2s ease-in-out infinite',
          }}
        >
          {/* Center scan line */}
          <div
            className="w-full absolute top-1/2"
            style={{
              height: '2px',
              background: 'rgba(74,222,128,0.7)',
              boxShadow: '0 0 8px rgba(74,222,128,0.8), 0 0 20px rgba(74,222,128,0.5), 0 0 40px rgba(74,222,128,0.3)',
            }}
          />
          <div
            className="w-full absolute top-1/2 mt-1 animate-pulse"
            style={{
              height: '1px',
              background: 'rgba(74,222,128,0.4)',
            }}
          />
        </div>
      )}

      {/* Layer 3: Red Flag markers that flash when scan bar passes */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          {redFlags.map((flag, i) => {
            const flagProgress = scanProgress * 100;
            const flagPosition = parseFloat(flag.top);
            const isVisible = flagProgress > flagPosition - 12 && flagProgress < flagPosition + 12;

            return (
              <div
                key={i}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  top: flag.top,
                  left: flag.left,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.7)',
                  transitionDelay: `${flag.delay}s`,
                }}
              >
                <div
                  className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-bold border border-destructive"
                  style={{
                    boxShadow: isVisible
                      ? '0 0 12px rgba(239,68,68,0.6), 0 0 24px rgba(239,68,68,0.3)'
                      : 'none',
                  }}
                >
                  {flag.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style>{`
        @keyframes scroll-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes scan-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
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
