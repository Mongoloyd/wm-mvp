import "@fontsource/dm-sans/800.css";

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
      className={`sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 transition-all duration-300 ease-in-out border-b ${
      scrolled ? "py-2 shadow-sm border-slate-200/50" : "py-4 border-transparent"}`
      }>
      
      <div className="flex items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <a href="/" className="font-['DM_Sans'] font-[800] text-lg select-none">
          <span className="text-[#0F1F35]">WINDOW</span>
          <span className="text-[#C8952A]">MAN</span>
          <sup className="text-[10px] text-gray-500 font-normal tracking-widest ml-0.5 align-super">.PRO</sup>
        </a>

        {/* Desktop: micro-copy + CTA */}
        <div className="hidden md:flex items-center gap-3">
          

          
          <button
            onClick={onCtaClick}
            className="bg-[#C8952A] text-white font-semibold px-5 py-2.5 rounded-md hover:brightness-110 transition-all">
            
            {ctaText}
          </button>
        </div>

        {/* Mobile: CTA only */}
        <button
          onClick={onCtaClick}
          className="md:hidden bg-[#C8952A] text-white font-semibold px-3 py-1.5 text-sm rounded-md hover:brightness-110 transition-all">
          
          {ctaText}
        </button>
      </div>
    </header>);

};

export default LinearHeader;