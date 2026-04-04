import SlideShell from "@/components/contractors/SlideShell";
import GlassPanel from "@/components/contractors/GlassPanel";
import EquationLockup from "@/components/contractors/EquationLockup";

const InsightSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-40 px-4 flex items-center justify-center min-h-[80vh]">
      <div className="max-w-2xl w-full">
        <SlideShell>
          <GlassPanel className="text-center py-16 md:py-20" glow>
            <EquationLockup />
            <p className="text-base md:text-lg mt-8 max-w-md mx-auto leading-relaxed text-secondary-foreground">
              Sending more traffic to an unvalidated quote doesn't close deals.
              It accelerates distrust. The bottleneck was never leads — it was
              always credibility.
            </p>
          </GlassPanel>
        </SlideShell>
      </div>
    </section>
  );
};

export default InsightSection;