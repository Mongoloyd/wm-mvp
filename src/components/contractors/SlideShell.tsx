import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface SlideShellProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}

const variants: Record<string, Variants> = {
  up: {
    initial: { opacity: 0, y: 60, rotateX: 4 },
    active: { opacity: 1, y: 0, rotateX: 0 },
    exit: { opacity: 0, y: -30 },
  },
  left: {
    initial: { opacity: 0, x: -60 },
    active: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 60 },
  },
  right: {
    initial: { opacity: 0, x: 60 },
    active: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  },
};

const SlideShell = ({ children, className = "", delay = 0, direction = "up" }: SlideShellProps) => {
  return (
    <motion.div
      className={className}
      style={{ perspective: 1200 }}
      initial="initial"
      whileInView="active"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants[direction]}
      transition={{
        duration: 1,
        delay,
        ease: premiumEase,
      }}
    >
      {children}
    </motion.div>
  );
};

export default SlideShell;