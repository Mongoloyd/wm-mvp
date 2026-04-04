import SlideShell from "@/components/contractors/SlideShell";
import GlassPanel from "@/components/contractors/GlassPanel";
import CTAButton from "@/components/contractors/CTAButton";

interface FinalCTASectionProps {
  onRequestAccess: () => void;
}

const FinalCTASection = ({ onRequestAccess }: FinalCTASectionProps) => {
  return (
    <section className="relative z-10 py-24 md:py-40 px-4 flex items-center justify-center min-h-[80vh]">
      <div className="max-w-xl w-full">
        <SlideShell>
          <GlassPanel className="text-center py-14 md:py-20" glow>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
              Ready to stop defending your quotes?
            </h2>
            <p className="text-base leading-relaxed mb-10 max-w-md mx-auto text-secondary-foreground">
              Windowman is built for contractors who win on scope, install quality,
              and warranty — not price games. If that's you, let's talk.
            </p>

            <CTAButton
              variant="primary"
              microcopy="Quality-first contractors only."
              onClick={onRequestAccess}
            >
              Request Contractor Access
            </CTAButton>
          </GlassPanel>
        </SlideShell>
      </div>
    </section>
  );
};

export default FinalCTASection;