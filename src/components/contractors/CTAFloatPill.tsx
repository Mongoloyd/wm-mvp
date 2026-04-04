import { motion, AnimatePresence } from "framer-motion";
import { useWarmIntent } from "@/hooks/useWarmIntent";

interface CTAFloatPillProps {
  onRequestAccess: () => void;
}

const CTAFloatPill = ({ onRequestAccess }: CTAFloatPillProps) => {
  const { intentState } = useWarmIntent();

  return (
    <AnimatePresence>
      {intentState === "warm" && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={onRequestAccess}
            className="contractors-glass-panel rounded-full px-6 py-3 flex items-center gap-3 shadow-[0_0_30px_hsl(var(--c-glow-orange)/0.2)] hover:shadow-[0_0_40px_hsl(var(--c-glow-orange)/0.4)] transition-shadow duration-300"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-foreground">
              Request Contractor Access
            </span>
          </button>
          <p className="text-[10px] text-center mt-1.5 text-secondary-foreground">
            Quality-first contractors only.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CTAFloatPill;