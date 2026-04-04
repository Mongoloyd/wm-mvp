import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

type CTAVariant = "primary" | "secondary" | "ghost" | "locked";

interface CTAButtonProps {
  children: ReactNode;
  variant?: CTAVariant;
  microcopy?: string;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<CTAVariant, string> = {
  primary:
    "bg-primary text-primary-foreground font-semibold shadow-[0_0_24px_hsl(var(--c-glow-orange)/0.35)] hover:shadow-[0_0_40px_hsl(var(--c-glow-orange)/0.55)]",
  secondary:
    "bg-secondary text-secondary-foreground font-medium border border-border hover:bg-secondary/80",
  ghost:
    "bg-transparent text-muted-foreground hover:text-foreground font-medium",
  locked:
    "bg-muted text-muted-foreground cursor-not-allowed opacity-60 font-medium",
};

const CTAButton = ({ children, variant = "primary", microcopy, onClick, className }: CTAButtonProps) => {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-8 h-12 text-base transition-all duration-300",
          variantStyles[variant],
          className
        )}
        whileHover={variant !== "locked" ? { scale: 1.03 } : undefined}
        whileTap={variant !== "locked" ? { scale: 0.98 } : undefined}
        onClick={variant !== "locked" ? onClick : undefined}
        disabled={variant === "locked"}
      >
        {children}
      </motion.button>
      {microcopy && (
        <span className="text-xs text-muted-foreground">{microcopy}</span>
      )}
    </div>
  );
};

export default CTAButton;