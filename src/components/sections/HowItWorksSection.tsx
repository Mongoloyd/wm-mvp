import { motion } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const steps = [
  { title: "Homeowner Gets Quotes", body: "They collect estimates from contractors." },
  { title: "They Upload Them to WindowMan", body: "We analyze pricing, scope, and risk." },
  { title: "We Break Down What's Wrong", body: "We surface inconsistencies, missing items, and red flags." },
  { title: "They Look for a Better Option", body: "This is where opportunity can shift." },
] as const;

const HowItWorksSection = () => (
  <section className="py-24 bg-zinc-950">
    <div className="max-w-6xl mx-auto px-6">
      <motion.h2 {...fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 text-center">
        How WindowMan Fits Into the Buying Process
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
        {steps.map((s, i) => (
          <motion.div key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm flex flex-col">
            <span className="text-sm font-semibold tracking-widest uppercase text-zinc-500 mb-3 block">Step {i + 1}</span>
            <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
            <p className="text-lg text-zinc-400 leading-relaxed">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
