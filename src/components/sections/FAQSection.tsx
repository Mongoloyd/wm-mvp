import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const items = [
  {
    q: "Are these shared leads?",
    a: "No. WindowMan routes one opportunity per buyer to one contractor per territory. There is no bidding, no marketplace, and no shared pool.",
  },
  {
    q: "Where do these buyers come from?",
    a: "They are homeowners who received quotes from other contractors and uploaded those estimates into WindowMan for analysis.",
  },
  {
    q: "Why are they higher intent than a normal lead?",
    a: "Because they already have a quote, already have a concern, and are already looking for a better option.",
  },
  {
    q: "How fast do I need to respond?",
    a: "Speed matters. These buyers are in an active decision window. Contractors who respond the same day consistently perform better than those who wait.",
  },
  {
    q: "What does it cost?",
    a: "Pricing and territory terms are confirmed on the walkthrough call.",
  },
  {
    q: "How do I get started?",
    a: "Book the walkthrough or check your territory using the qualification flow on this page.",
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIdx(openIdx === i ? null : i);

  return (
    <section className="py-24 bg-black">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          {...fadeUp}
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-12 text-center"
        >
          Common Questions
        </motion.h2>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left min-h-[56px]"
              >
                <span className="text-white font-medium pr-4">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-200 ${
                    openIdx === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <p className="text-zinc-400 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
