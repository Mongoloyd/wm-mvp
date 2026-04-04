import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface TactileGlassCardProps {
  children: ReactNode;
  className?: string;
}

const TactileGlassCard = ({ children, className }: TactileGlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "contractors-glass-panel rounded-xl p-6 md:p-8 cursor-default",
        "transition-shadow duration-300",
        className
      )}
      whileHover={{
        y: -4,
        boxShadow:
          "inset 0 1px 0 0 hsla(0,0%,100%,0.12), inset 0 -1px 0 0 hsla(0,0%,0%,0.2), 0 24px 64px -16px hsla(0,0%,0%,0.6), 0 0 32px hsla(30,100%,56%,0.06)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {children}
    </motion.div>
  );
};

export default TactileGlassCard;