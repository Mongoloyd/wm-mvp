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
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backgroundColor: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1A1A1A",
        transition: "padding 0.15s ease",
        padding: scrolled ? "8px 0" : "16px 0",
      }}
    >
      <div className="flex items-center justify-between px-4 md:px-8">
        <a href="/" className="select-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.02em" }}>
          <span style={{ color: "#E5E5E5" }}>WINDOW</span>
          <span style={{ color: "#C8952A" }}>MAN</span>
          <sup style={{ fontSize: 9, color: "#6B7280", fontWeight: 400, letterSpacing: "0.15em", marginLeft: 2, verticalAlign: "super" }}>.PRO</sup>
        </a>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onCtaClick}
            style={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1D4ED8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#2563EB"; }}
          >
            {ctaText}
          </button>
        </div>

        <button
          onClick={onCtaClick}
          className="md:hidden"
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            padding: "6px 12px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {ctaText}
        </button>
      </div>
    </header>
  );
};

export default LinearHeader;
