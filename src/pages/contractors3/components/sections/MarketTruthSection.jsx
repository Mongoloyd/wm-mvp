import React from "react";
import { motion } from "framer-motion";
import { FileText, Scale, ArrowRightLeft } from "lucide-react";

export default function MarketTruthSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="w-full py-24">
      <div className="mb-16 flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Your Best Buyers Already Got Quotes From Someone Else First.
        </h2>
        <p className="max-w-[70ch] text-base leading-relaxed text-white/60 lg:text-lg">
          Homeowners don't start by searching for the best contractor. They start by collecting estimates — then get confused, skeptical, or uneasy. WindowMan captures them at that exact moment.
        </p>
      </div>

      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={itemVariants} className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.03]">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <FileText size={24} />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-white">They Already Have a Quote</h3>
          <p className="text-sm leading-relaxed text-white/70">
            The homeowner didn't come from a Google ad. They came with paperwork from one of your competitors.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.03]">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <Scale size={24} />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-white">They Are Actively Comparing</h3>
          <p className="text-sm leading-relaxed text-white/70">
            They uploaded that quote because something felt off. They want to understand it before they commit to a massive investment.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1 flex flex-col items-start gap-8 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-8 md:col-span-2 md:flex-row md:items-center lg:p-10">
          <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
            <ArrowRightLeft size={32} />
          </div>
          <div>
            <h3 className="mb-3 text-2xl font-bold text-white">They Are Open to Switching</h3>
            <p className="max-w-[75ch] text-base leading-relaxed text-white/70">
              When WindowMan exposes problems in a competitor estimate—like missing permits, vague scopes, or unverified products—the buyer becomes immediately motivated to find a better, more trustworthy option.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}