import SlideShell from "@/components/contractors/SlideShell";
import SectionHeader from "@/components/contractors/SectionHeader";
import TactileGlassCard from "@/components/contractors/TactileGlassCard";
import { ShieldCheck, FileText, Star } from "lucide-react";

const bullets = [
  {
    icon: ShieldCheck,
    text: "Independent, AI-powered scope validation that homeowners trust",
  },
  {
    icon: FileText,
    text: "Detailed audit reports that translate contractor language into buyer language",
  },
  {
    icon: Star,
    text: "Quality signals that separate premium contractors from price competitors",
  },
];

const SolutionSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <SlideShell direction="left">
            <div>
              <SectionHeader
                title="What if the homeowner already understood your quote?"
                body="Windowman audits quotes before the homeowner talks to you. By the time they reach out, they already know what good looks like — and that you're it."
              />
              <div className="mt-8 space-y-4">
                {bullets.map((b) => (
                  <div key={b.text} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                      <b.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-secondary-foreground">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </SlideShell>

          <SlideShell direction="right">
            <TactileGlassCard className="p-0 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                    Audit Report
                  </span>
                  <span className="text-xs text-muted-foreground/60">• Sample</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                    <span className="text-sm text-foreground">Scope Completeness</span>
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--c-audit-pass))" }}>92%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                    <span className="text-sm text-foreground">Price vs. Market</span>
                    <span className="text-sm font-bold text-primary">Fair</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                    <span className="text-sm text-foreground">Warranty Coverage</span>
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--c-audit-pass))" }}>Strong</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                    <span className="text-sm text-foreground">Install Method</span>
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--c-audit-warn))" }}>Review</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/30">
                  <p className="text-xs text-secondary-foreground">
                    "This quote reflects premium scope with documented water management.
                    Price aligns with regional averages for full-frame replacement."
                  </p>
                </div>
              </div>
            </TactileGlassCard>
          </SlideShell>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;