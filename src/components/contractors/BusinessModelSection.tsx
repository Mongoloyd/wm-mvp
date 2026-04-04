import SlideShell from "@/components/contractors/SlideShell";
import SectionHeader from "@/components/contractors/SectionHeader";
import GlassPanel from "@/components/contractors/GlassPanel";
import { motion } from "framer-motion";

const bars = [
  { label: "Per-Audit Fee", height: 40, desc: "Paid by homeowner. Free for contractor." },
  { label: "Performance Referral", height: 70, desc: "You pay only when a validated lead converts." },
  { label: "Premium Placement", height: 55, desc: "Optional visibility boost in your service area." },
];

const BusinessModelSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <SlideShell direction="left">
            <div>
              <SectionHeader
                title="Aligned incentives. No lead-gen games."
                body="Windowman doesn't sell lists or charge subscriptions. The model is performance-based — we only win when you win."
              />
              <ul className="mt-8 space-y-3">
                <li className="text-sm flex items-start gap-2 text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  No monthly fees. No per-lead charges.
                </li>
                <li className="text-sm flex items-start gap-2 text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  Performance-based: you pay when deals close.
                </li>
                <li className="text-sm flex items-start gap-2 text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  Zero risk to try. Quality contractors cost nothing until results arrive.
                </li>
              </ul>
            </div>
          </SlideShell>

          <SlideShell direction="right">
            <GlassPanel>
              <div className="flex items-end justify-center gap-8 h-64">
                {bars.map((bar, i) => (
                  <div key={bar.label} className="flex flex-col items-center gap-2">
                    <motion.div
                      className="w-16 rounded-t-lg bg-gradient-to-t from-primary/60 to-primary"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${bar.height}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.15 + 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                    <span className="text-xs font-semibold text-foreground text-center w-20">
                      {bar.label}
                    </span>
                    <span className="text-[10px] text-center w-24 text-secondary-foreground">
                      {bar.desc}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </SlideShell>
        </div>
      </div>
    </section>
  );
};

export default BusinessModelSection;