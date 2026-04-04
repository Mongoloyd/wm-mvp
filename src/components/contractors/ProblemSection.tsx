import SlideShell from "@/components/contractors/SlideShell";
import SectionHeader from "@/components/contractors/SectionHeader";
import TactileGlassCard from "@/components/contractors/TactileGlassCard";
import { AlertTriangle, DollarSign, Clock } from "lucide-react";

const bullets = [
  {
    icon: AlertTriangle,
    title: "Homeowners ghost after receiving your quote",
    body: "They're not comparing price — they don't understand scope.",
  },
  {
    icon: DollarSign,
    title: "Quality contractors subsidize the cheap ones",
    body: "When every quote looks the same, the cheapest one wins by default.",
  },
  {
    icon: Clock,
    title: "Your sales cycle is a trust-building exercise",
    body: "Hours spent educating people who still aren't sure you're being honest.",
  },
];

const ProblemSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <SlideShell direction="left">
              <SectionHeader
                title="You're losing deals you should be winning."
                body="The problem isn't your price. It's that homeowners have no framework for understanding what you're offering."
              />
            </SlideShell>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <SlideShell delay={0.15}>
              <TactileGlassCard className="border-l-2 border-l-primary/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                </div>
                <p className="text-sm font-mono text-secondary-foreground">
                  Quote #1: $12,400 — "Premium vinyl, full-frame replacement"
                </p>
                <p className="text-sm font-mono mt-1 text-secondary-foreground">
                  Quote #2: $8,900 — "Window replacement"
                </p>
                <p className="text-xs mt-3 text-secondary-foreground">
                  Same project. Same house. Wildly different scopes. The homeowner sees only the price.
                </p>
              </TactileGlassCard>
            </SlideShell>

            {bullets.map((b, i) => (
              <SlideShell key={b.title} delay={0.1 * (i + 2)}>
                <TactileGlassCard>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                      <p className="text-sm text-secondary-foreground">{b.body}</p>
                    </div>
                  </div>
                </TactileGlassCard>
              </SlideShell>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;