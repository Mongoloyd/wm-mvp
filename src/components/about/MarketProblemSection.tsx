import SectionEyebrow from "./SectionEyebrow";
import SectionHeading from "./SectionHeading";
import SkeuoCard from "./SkeuoCard";

export default function MarketProblemSection() {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:px-8 md:py-24" style={{ background: "transparent" }}>
      {/* Depth L1 — soft blue radial blob, upper right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: "-15%",
          right: "-10%",
          width: "60%",
          height: "80%",
          background: "radial-gradient(ellipse at 65% 30%, rgba(30,80,180,0.09) 0%, rgba(99,150,220,0.04) 50%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Depth L2 — cool atmosphere wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(155deg, rgba(219,234,254,0.12) 0%, transparent 60%)" }}
      />
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <SectionEyebrow className="mb-4">THE STRUCTURAL FAILURE</SectionEyebrow>
          <SectionHeading className="mb-6">
            This Isn't a Contractor Problem — It's a Market Problem
          </SectionHeading>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground/80 md:text-lg">
            Most homeowners assume pricing differences come down to honesty or
            quality. In reality, they come from information imbalance. The side
            with better data controls the outcome.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1 */}
          <SkeuoCard>
            <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-foreground">
              Homeowner Buys Rarely
            </h3>
            <p className="text-base leading-relaxed text-foreground/70">
              Most people replace windows once or twice in a lifetime. They
              enter the process with low pattern recognition, low pricing
              context, and limited contract fluency.
            </p>
          </SkeuoCard>

          {/* Card 2 */}
          <SkeuoCard>
            <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-foreground">
              Contractor Quotes Constantly
            </h3>
            <p className="text-base leading-relaxed text-foreground/70">
              Contractors live inside scope, labor assumptions, margin
              structure, exclusions, and pricing strategy. They naturally
              operate with more information.
            </p>
          </SkeuoCard>

          {/* Card 3 */}
          <SkeuoCard>
            <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-foreground">
              Pricing Lacks a Standard
            </h3>
            <p className="text-base leading-relaxed text-foreground/70">
              Two quotes can describe the same project and still vary wildly in
              scope clarity, warranty strength, labor detail, and total price.
              Without normalization, price is misleading.
            </p>
          </SkeuoCard>
        </div>
      </div>
    </section>
  );
}
