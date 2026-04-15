import { motion } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const typical = ["Top-of-funnel", "Low intent", "Price shoppers", "Long sales cycle"];
const windowman = ["Mid-decision buyers", "Active evaluation", "Higher clarity", "Shorter path to decision"];

const DifferentiationSection = () => (
  <section className="py-24 bg-zinc-950">
    <div className="max-w-4xl mx-auto px-6">
      <motion.h2 {...fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-14 text-center">
        This Is Not Traditional Lead Generation
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Typical — muted */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm flex flex-col opacity-50">
          <span className="text-sm font-semibold tracking-widest uppercase text-slate-300 mb-3 block">Typical Lead Generation</span>
          <ul className="space-y-3 mt-2">
            {typical.map((t) => (
              <li key={t} className="text-lg text-slate-200 leading-relaxed">— {t}</li>
            ))}
          </ul>
        </motion.div>
        {/* WindowMan — highlighted */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm flex flex-col shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <span className="text-sm font-semibold tracking-widest uppercase text-slate-300 mb-3 block">WindowMan Approach</span>
          <ul className="space-y-3 mt-2">
            {windowman.map((w) => (
              <li key={w} className="text-lg text-white leading-relaxed">— {w}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

export default DifferentiationSection;
