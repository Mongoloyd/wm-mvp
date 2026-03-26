import "@fontsource/dm-sans/800.css";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
      className="sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur-xl"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
        transition: "padding 0.15s ease",
        padding: scrolled ? "6px 0" : "14px 0",
      }}
    >
      <div className="flex items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <a
          href="/"
          className="select-none group relative inline-flex items-center gap-2"
          aria-label="WindowMan.PRO home"
        >
          {/* Shield icon with glint on hover */}
          <span className="relative overflow-hidden inline-flex">
            <ShieldCheck
              size={20}
              className="text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(37,99,235,0.7)]"
            />
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "0.02em",
            }}
          >
            <span className="text-foreground">WINDOW</span>
            <span style={{ color: "#C8952A" }}>MAN</span>
            <sup
              className="text-muted-foreground"
              style={{
                fontSize: 9,
                fontWeight: 400,
                letterSpacing: "0.15em",
                marginLeft: 2,
                verticalAlign: "super",
              }}
            >
              .PRO
            </sup>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <button
            className="btn-depth-primary px-5"
            style={{ fontSize: 14, padding: "10px 20px" }}
            onClick={onCtaClick}
          >
            {ctaText}
          </button>
        </div>

        {/* Mobile CTA */}
        <button
          className="btn-depth-primary md:hidden"
          style={{ fontSize: 13, padding: "6px 14px" }}
          onClick={onCtaClick}
        >
          {ctaText}
        </button>
      </div>

      {/* Animated status bar — "live intelligence" pulse line */}
      <motion.div
        className="absolute bottom-0 left-0 h-[1px] bg-primary/30"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />
    </header>
  );
};

export default LinearHeader;
