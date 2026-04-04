import SlideShell from "@/components/contractors/SlideShell";
import SectionHeader from "@/components/contractors/SectionHeader";
import GlassPanel from "@/components/contractors/GlassPanel";
import Flywheel from "@/components/contractors/Flywheel";

const DefensibilitySection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <SlideShell direction="left">
            <div>
              <SectionHeader
                title="A flywheel that compounds over time."
                body="Every audit makes the next one smarter. Every quality contractor deepens the trust network. This isn't a marketplace — it's infrastructure."
              />
              <ul className="mt-8 space-y-3">
                <li className="text-sm flex items-start gap-2 text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  Proprietary scope + pricing dataset grows with every audit
                </li>
                <li className="text-sm flex items-start gap-2 text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  Network effects: more contractors → better matching → more homeowners
                </li>
                <li className="text-sm flex items-start gap-2 text-secondary-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  Trust brand moat: neutrality can't be replicated by contractors themselves
                </li>
              </ul>
            </div>
          </SlideShell>

          <SlideShell direction="right">
            <GlassPanel glow>
              <Flywheel />
            </GlassPanel>
          </SlideShell>
        </div>
      </div>
    </section>
  );
};

export default DefensibilitySection;