
import React from "react";
import { motion } from "framer-motion";

export default function BuyerReadinessSection() {
  const steps = [
    { num: "01", title: "The Homeowner Gets a Quote", body: "They collect an estimate from a competitor, but feel uneasy about the price, the pressure, or the vague details." },
    { num: "02", title: "They Upload It Into WindowMan", body: "Seeking clarity, they upload the quote. We scan it and expose the red flags: missing permits, unverified specs, inflated labor." },
    { num: "03", title: "Trust Breaks Down. Motivation Builds.", body: "Realizing they almost overpaid for a worse outcome, they want a trustworthy alternative immediately." }
  ];

  return (
    <section className="mx-auto w-full max-w-5xl py-24">
      <div className="mb-16 flex flex-col items-center text-center">
        <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-white/50">The Buyer Journey</span>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
          How They Go From Skeptical to Ready
        </h2>
      </div>

      <div className="relative mb-16 flex flex-col gap-8 md:flex-row md:items-start md:gap-0">
        <div className="absolute left-1/6 right-1/6 top-6 hidden h-px -translate-y-1/2 bg-white/[0.15] md:block" />
        {steps.map((step, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.15, duration: 0.6 }}
            className="relative flex flex-1 flex-col items-center text-center md:px-6">
            {idx !== steps.length - 1 && (
              <div className="absolute left-1/2 top-12 bottom-[-2rem] w-px -translate-x-1/2 bg-white/[0.15] md:hidden" />
            )}
            <div className="mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white bg-[#080808] z-10">
              <span className="text-sm font-bold text-white">{step.num}</span>
            </div>
            <h3 className="mb-3 text-lg font-bold text-white">{step.title}</h3>
            <p className="text-sm leading-relaxed text-white/60 max-w-[280px]">{step.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center shadow-lg md:p-12">
        <p className="mx-auto max-w-3xl text-xl font-medium leading-relaxed text-white md:text-2xl">
          "By the time they reach you, they are more educated, more emotionally activated, and more ready to move than any lead you've worked before."
        </p>
      </div>
    </section>
  );
}