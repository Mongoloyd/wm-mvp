
import React from "react";
import { motion } from "framer-motion";

export default function HowItWorksSection() {
  const steps = [
    { title: "Homeowner Receives a Competitor Quote", body: "They get an estimate that doesn't feel quite right, but they don't know enough to articulate why." },
    { title: "They Upload It Into WindowMan", body: "Looking for a second opinion without another high-pressure sales pitch, they use our 60-second scan." },
    { title: "WindowMan Diagnoses the Estimate", body: "We identify red flags like vague scope, missing permits, and unverified product ratings." },
    { title: "The Buyer Wants a Better Option", body: "Now educated on what to look out for, the homeowner is highly motivated to find a trustworthy alternative." },
    { title: "One Contractor in the Territory Gets the Opportunity", body: "This is an exclusive path. The opportunity is routed directly to the single protected contractor in that area." }
  ];

  return (
    <section className="w-full bg-[#0d0d0d] py-24">
      <div className="mx-auto w-full max-w-2xl px-6">
        <h2 className="mb-16 text-center text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
          How Contractor Access Works
        </h2>
        <div className="flex flex-col">
          {steps.map((step, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.12, duration: 0.5 }}
              className="group relative flex flex-col border-b border-white/[0.08] py-8 last:border-0">
              <div className="absolute -left-4 top-4 text-7xl font-extrabold text-white opacity-[0.03] select-none pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.06]">
                {idx + 1}
              </div>
              <div className="relative pl-12 sm:pl-16">
                <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                <p className="text-base leading-relaxed text-white/60">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="mt-12 rounded-2xl border border-white/[0.1] bg-white/[0.05] p-6 text-center lg:p-8">
          <p className="text-base font-semibold leading-relaxed text-white/90">
            This is not a shared lead pool. There is no bidding. <br className="hidden sm:block" />
            One contractor per territory, one opportunity per buyer.
          </p>
        </motion.div>
      </div>
    </section>
  );
}