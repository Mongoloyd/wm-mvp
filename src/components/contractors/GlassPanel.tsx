import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

const GlassPanel = ({ children, className, glow = false }: GlassPanelProps) => {
  return (
    <div
      className={cn(
        "contractors-glass-panel rounded-2xl p-8 md:p-10 relative",
        glow && "shadow-[0_0_40px_hsl(var(--c-glow-orange)/0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassPanel;