import SectionEyebrow from "./SectionEyebrow";
import SectionHeading from "./SectionHeading";
import SkeuoCard from "./SkeuoCard";

export default function MarketProblemSection() {
  return (
    <section className="bg-slate-100 px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
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
