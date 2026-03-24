import { useState, useEffect } from "react";

interface LinearHeaderProps {
  ctaText?: string;
  onCtaClick?: () => void;
}

const LinearHeader = ({ ctaText = "Get Started Free", onCtaClick }: LinearHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border transition-all duration-150 ${scrolled ? "py-2" : "py-4"}`}
    >
      <div className="flex items-center justify-between px-4 md:px-8">
        <a href="/" className="select-none font-display font-extrabold text-xl tracking-wide">
          <span className="text-foreground">WINDOW</span>
          <span className="text-wm-gold">MAN</span>
          <sup className="text-[9px] text-muted-foreground font-normal tracking-[0.15em] ml-0.5 align-super">.PRO</sup>
        </a>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onCtaClick}
            className="btn-depth-primary rounded-lg font-body font-bold text-sm px-5 py-2.5"
          >
            {ctaText}
          </button>
        </div>

        <button
          onClick={onCtaClick}
          className="md:hidden btn-depth-primary rounded-lg font-body font-bold text-[13px] px-3 py-1.5"
        >
          {ctaText}
        </button>
      </div>
    </header>
  );
};

export default LinearHeader;
