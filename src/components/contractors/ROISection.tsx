import SlideShell from "@/components/contractors/SlideShell";
import GlassPanel from "@/components/contractors/GlassPanel";
import TactileGlassCard from "@/components/contractors/TactileGlassCard";
import MetricRow from "@/components/contractors/MetricRow";
import { MessageSquareOff, Clock, TrendingUp } from "lucide-react";

const ROISection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SlideShell>
            <GlassPanel glow className="h-full">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                The ROI of pre-educated buyers
              </h2>
              <p className="text-sm leading-relaxed text-secondary-foreground">
                When homeowners understand scope before your first conversation,
                everything downstream improves — close rate, margin, and the
                conversations themselves.
              </p>
            </GlassPanel>
          </SlideShell>

          <SlideShell delay={0.1}>
            <TactileGlassCard className="h-full">
              <MetricRow
                icon={MessageSquareOff}
                value="67%"
                label="Fewer price objections on first call"
              />
            </TactileGlassCard>
          </SlideShell>

          <SlideShell delay={0.2}>
            <TactileGlassCard className="h-full">
              <MetricRow
                icon={Clock}
                value="4.2 days"
                label="Average reduction in sales cycle"
              />
            </TactileGlassCard>
          </SlideShell>

          <SlideShell delay={0.3}>
            <GlassPanel className="h-full">
              <MetricRow
                icon={TrendingUp}
                value="+22%"
                label="Margin protection on premium scope"
              />
              <p className="text-xs mt-4 text-secondary-foreground">
                Contractors using Windowman report fewer discount requests and
                higher close rates on full-scope proposals.
              </p>
            </GlassPanel>
          </SlideShell>
        </div>
      </div>
    </section>
  );
};

export default ROISection;