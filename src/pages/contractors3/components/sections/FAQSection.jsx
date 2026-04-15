
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Are these shared leads?", a: "No. WindowMan routes one opportunity per buyer to one contractor per territory. There is no bidding, no marketplace, no shared pool." },
  { q: "Where do these buyers come from?", a: "They are homeowners who received quotes from other contractors and uploaded those estimates into WindowMan for analysis. They arrive motivated, not cold." },
  { q: "Why are they higher intent than a normal lead?", a: "Because they already have a quote, already have a problem with it, and are already looking for a better option. That is a fundamentally different buyer than someone who clicked a Facebook ad." },
  { q: "How fast do I need to respond?", a: "Speed matters. These buyers are in an active decision window. Contractors who contact opportunities within the same day consistently outperform those who wait. This system rewards responsiveness." },
  { q: "What does it cost?", a: "Pricing and territory terms are confirmed on the 10-minute walkthrough call. There are no hidden fees discussed before that conversation." },
  { q: "How do I get started?", a: "Book the 10-minute walkthrough using the calendar on this page. We'll confirm territory availability and walk through how it works." }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleOpen = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <section className="mx-auto w-full max-w-3xl py-24">
      <div className="mb-12 flex justify-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">Common Questions</h2>
      </div>
      <div className="flex flex-col">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border-b border-white/[0.06]">
              <button onClick={() => toggleOpen(idx)} className="flex w-full items-center justify-between py-6 text-left focus:outline-none">
                <span className="text-base font-medium text-white">{faq.q}</span>
                <motion.div initial={false} animate={{ rotate: isOpen ? 180 : 0 }} className="ml-4 shrink-0 text-white/50">
                  {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    <p className="pb-6 pr-8 text-sm leading-relaxed text-white/60">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}