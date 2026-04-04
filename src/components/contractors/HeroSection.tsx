import { motion } from "framer-motion";
import CTAButton from "@/components/contractors/CTAButton";
import GlassPanel from "@/components/contractors/GlassPanel";

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface HeroSectionProps {
  onSeeHowItWorks?: () => void;
}

const HeroSection = ({ onSeeHowItWorks }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 z-10">
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--c-glow-orange) / 0.12) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        style={{ perspective: 1200 }}
        initial={{ opacity: 0, y: 40, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, ease: premiumEase }}
      >
        <GlassPanel className="max-w-2xl w-full p-10 md:p-14 text-center" glow>
          <motion.div
            className="relative inline-block mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: premiumEase }}
          >
            <span className="text-sm font-semibold tracking-[0.2em] uppercase text-primary">
              Windowman AI
            </span>
            <motion.span
              className="absolute inset-0 -m-3 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--c-glow-orange) / 0.25) 0%, transparent 70%)",
              }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: premiumEase }}
          >
            Stop Explaining Your Quotes.{" "}
            <span className="text-primary">Let Trust Do the Work.</span>
          </motion.h1>

          <motion.h2
            className="text-base md:text-lg font-medium mb-6 text-secondary-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: premiumEase }}
          >
            Windowman is a neutral quote audit that pre-educates homeowners
            before they ever talk to you.
          </motion.h2>

          <motion.p
            className="text-sm leading-relaxed mb-10 max-w-lg mx-auto text-secondary-foreground md:text-lg"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: premiumEase }}
          >
            Most contractors lose deals not because of price — but because
            homeowners don't understand what they're buying. Windowman fixes that
            by validating quotes independently, so quality contractors don't have
            to defend themselves.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85, ease: premiumEase }}
          >
            <CTAButton
              variant="primary"
              microcopy="2-minute walkthrough. No commitment."
              onClick={onSeeHowItWorks}
            >
              See How It Works
            </CTAButton>
          </motion.div>
        </GlassPanel>
      </motion.div>
    </section>
  );
};

export default HeroSection;