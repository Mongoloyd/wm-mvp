import SlideShell from "@/components/contractors/SlideShell";
import SectionHeader from "@/components/contractors/SectionHeader";
import GlassPanel from "@/components/contractors/GlassPanel";
import TactileGlassCard from "@/components/contractors/TactileGlassCard";
import { motion } from "framer-motion";

const timelineNodes = [
  {
    label: "2019",
    title: "Homeowners started researching online",
    body: "Reviews, YouTube, forums — they arrive with opinions before you do.",
  },
  {
    label: "2022",
    title: "AI made comparison shopping instant",
    body: "Price transparency without scope transparency created chaos.",
  },
  {
    label: "Now",
    title: "Trust is the last competitive moat",
    body: "Contractors who pre-validate scope win. Everyone else competes on price.",
  },
];

const MarketRealitySection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <SlideShell direction="left">
              <SectionHeader
                title="The market shifted. Most contractors didn't."
                body="Homeowner behavior has fundamentally changed. The old playbook of 'explain it in the kitchen' doesn't work anymore."
              />
            </SlideShell>
          </div>

          <div className="lg:col-span-7">
            <SlideShell>
              <GlassPanel>
                <div className="space-y-8">
                  {timelineNodes.map((node, i) => (
                    <motion.div
                      key={node.label}
                      className="flex gap-4"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ delay: i * 0.2 + 0.2, duration: 0.6 }}
                    >
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary"
                          whileInView={{
                            boxShadow: [
                              "0 0 0px hsl(30 100% 56% / 0.2)",
                              "0 0 16px hsl(30 100% 56% / 0.5)",
                              "0 0 0px hsl(30 100% 56% / 0.2)",
                            ],
                          }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.3 + 0.5, duration: 1.5 }}
                        >
                          {node.label}
                        </motion.div>
                        {i < timelineNodes.length - 1 && (
                          <div className="w-px h-8 bg-border/30 mt-2" />
                        )}
                      </div>
                      <div className="pb-2">
                        <h3 className="font-semibold text-foreground text-sm mb-1">
                          {node.title}
                        </h3>
                        <p className="text-sm text-secondary-foreground">{node.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassPanel>
            </SlideShell>

            <SlideShell delay={0.3} className="mt-6">
              <TactileGlassCard>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-semibold">78% of homeowners</span>{" "}
                  say they distrust contractor pricing — not because contractors are
                  dishonest, but because there's no neutral reference point.
                </p>
              </TactileGlassCard>
            </SlideShell>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketRealitySection;