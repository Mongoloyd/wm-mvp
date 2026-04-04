import SlideShell from "@/components/contractors/SlideShell";
import SectionHeader from "@/components/contractors/SectionHeader";
import TactileGlassCard from "@/components/contractors/TactileGlassCard";
import { Upload, Search, ClipboardCheck, UserCheck } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Homeowner uploads quotes",
    body: "They drop in 2–3 quotes from different contractors. No contractor sees the others.",
  },
  {
    icon: Search,
    step: "02",
    title: "AI analyzes scope & pricing",
    body: "Windowman breaks down line items, materials, installation methods, and warranty terms.",
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Neutral audit is generated",
    body: "A clear, visual report shows what's good, what's missing, and what questions to ask.",
  },
  {
    icon: UserCheck,
    step: "04",
    title: "Educated buyer contacts you",
    body: "They already understand scope. Your conversation starts from trust, not suspicion.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <SlideShell className="mb-12 md:mb-16">
          <SectionHeader
            title="How Windowman works"
            body="Four steps from quote confusion to confident buyer."
            align="center"
          />
        </SlideShell>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <SlideShell key={s.step} delay={i * 0.1}>
              <TactileGlassCard className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground/50">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed text-secondary-foreground">{s.body}</p>
              </TactileGlassCard>
            </SlideShell>
          ))}
        </div>

        <SlideShell delay={0.5} className="mt-10 text-center">
          <p className="text-xs text-secondary-foreground">
            Average audit time: 90 seconds. Average homeowner confidence increase: 3.4×
          </p>
        </SlideShell>
      </div>
    </section>
  );
};

export default HowItWorksSection;