import { ReactNode } from "react";

export function XRayScannerBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/* Scanning bar effect - hidden on mobile */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none" style={{ top: 280 }}>
        {/* Pulsing scan bar */}
        <div className="absolute left-0 right-0 h-48 animate-pulse opacity-10 bg-gradient-to-b from-transparent via-[hsl(25,95%,53%)] to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
