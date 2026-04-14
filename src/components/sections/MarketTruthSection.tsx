import { motion } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const cards = [
  {
    title: "They Already Have a Quote",
    body: "Most homeowners start by collecting estimates before making a decision.",
  },
  {
    title: "They're Confused or Skeptical",
    body: "Pricing, scope, and trust don't always line up. Something feels off.",
  },
  {
    title: "They're Open to Switching",
    body: "This is where real opportunity exists — not at the top of the funnel.",
  },
] as const;

const MarketTruthSection = () => (
  <section className="py-24">
    <div className="max-w-4xl mx-auto px-6">
      <motion.h2
        {...fadeUp}
        className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center mb-14"
      >
        Your Best Buyers Already Got Quotes From Someone Else First.
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
          >
            <h3 className="text-base font-semibold text-white/90 mb-2">
              {card.title}
            </h3>
            <p className="text-sm text-white/50 leading-relaxed">
              {card.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default MarketTruthSection;
