import "@fontsource/dm-sans/800.css";
import "@fontsource/dm-mono/400.css";

import React from "react";

const LinearHeader = () => {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b animate-header-slide-down"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E7EB",
      }}
    >
      <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-8">
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 18 }}>
          <span style={{ color: "#0F1F35" }}>WINDOW</span>
          <span style={{ color: "#C8952A" }}>MAN</span>
          <sup style={{ fontSize: 10, color: "#6B7280", fontWeight: 400, letterSpacing: "0.1em", marginLeft: 2, verticalAlign: "super" }}>.PRO</sup>
        </div>
        {/* Right side reserved for hamburger (mobile) / sign-up (desktop) */}
      </div>
    </header>
  );
};

export default LinearHeader;

