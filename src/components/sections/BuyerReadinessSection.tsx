import { motion } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const cards = [
  { title: "They Already Spoke to Competitors", body: "They've sat through presentations and seen pricing." },
  { title: "They Have Doubts", body: "Something doesn't add up — price, scope, or trust." },
  { title: "They're Still Deciding", body: "This is the window where better positioning can matter." },
] as const;

const BuyerReadinessSection = () => (
  <section className="py-24 bg-black">
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      <div>
        <motion.h2 {...fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
          These Buyers Are Already Trying to Decide.
        </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="text-lg text-zinc-400 leading-relaxed">
          This is the moment most contractors never see — the point where the homeowner has multiple quotes and is trying to figure out what's real, what's missing, and who to trust.
        </motion.p>
      </div>
      <div className="flex flex-col gap-5">
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

export default BuyerReadinessSection;
