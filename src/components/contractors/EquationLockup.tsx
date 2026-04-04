import { motion } from "framer-motion";

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const EquationLockup = () => {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6 text-3xl md:text-5xl lg:text-6xl font-bold">
      <motion.span
        className="text-foreground"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: premiumEase }}
      >
        Traffic
      </motion.span>

      <motion.span
        className="text-destructive"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.5,
          delay: 0.3,
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
      >
        ≠
      </motion.span>

      <motion.span
        className="text-primary relative"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5, ease: premiumEase }}
      >
        Trust
        <motion.span
          className="absolute inset-0 -m-2 rounded-lg"
          style={{
            background: "radial-gradient(circle, hsl(var(--c-glow-orange) / 0.3) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.7 }}
        />
      </motion.span>
    </div>
  );
};

export default EquationLockup;