import { motion } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const cards = [
  { title: "Higher Intent", body: "These buyers are already evaluating options." },
  { title: "Less Education Required", body: "They've already been through the sales process." },
  { title: "More Efficient Spend", body: "Effort is focused where decisions are actually made." },
] as const;

const EconomicsSection = () => (
  <section className="py-24 bg-black">
    <div className="max-w-4xl mx-auto px-6">
      <motion.h2 {...fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 text-center">
        The Economics of Intercepting Buyers Mid-Decision
      </motion.h2>
      <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="text-lg text-zinc-400 leading-relaxed text-center mb-14">
        Instead of paying to generate initial interest, you're engaging buyers who have already entered the decision phase.
      </motion.p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <motion.div key={c.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm flex flex-col">
            <h3 className="text-xl font-bold text-white mb-3">{c.title}</h3>
            <p className="text-lg text-zinc-400 leading-relaxed">{c.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EconomicsSection;
