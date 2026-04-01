import SectionEyebrow from "./SectionEyebrow";
import SectionHeading from "./SectionHeading";

interface StatItem {
  label: string;
  value: string;
}

interface TrustProofSectionProps {
  stats?: StatItem[];
}

const defaultStats: StatItem[] = [
  { label: "Quotes Analyzed", value: "2,400+" },
  { label: "Counties Tracked", value: "38" },
  { label: "Hidden Risks Flagged", value: "6,100+" },
];

const proofItems = [
  "Scope detail",
  "Material assumptions",
  "Warranty posture",
  "Exclusion language",
  "Price position",
  "Change-order exposure",
];

export default function TrustProofSection({ stats }: TrustProofSectionProps) {
  const displayStats = stats ?? defaultStats;

  return (
    <section className="bg-slate-100 px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <SectionEyebrow className="mb-4">THE PROOF LAYER</SectionEyebrow>
          <SectionHeading className="mb-6">Data, Not Promises.</SectionHeading>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground/80 md:text-lg">
            We do not rely on vague claims or empty reassurance. We rely on
            contract structure, county baselines, normalized quote comparison,
            and repeatable detection of weak pricing and weak scope.
          </p>
        </div>

        {/* A) StatStrip */}
        <div className="mb-10 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:gap-8 md:p-8"
          style={{
            boxShadow:
              "0 4px 6px rgba(15,30,60,0.06), 0 12px 40px rgba(15,30,60,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {displayStats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-1 text-center ${
                i < displayStats.length - 1
                  ? "border-r border-slate-200 pr-4 md:pr-8"
                  : ""
              }`}
            >
              <span
                className="font-display text-2xl font-extrabold tracking-tight md:text-3xl"
                style={{ color: "#06B6D4" }}
              >
                {stat.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* B) ProofPanel */}
        <div
          className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8"
          style={{
            boxShadow:
              "inset 0 2px 6px rgba(10,25,55,0.04), inset 0 1px 2px rgba(10,25,55,0.03)",
          }}
        >
          <p className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            What We Actually Inspect
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {proofItems.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: "#06B6D4" }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-foreground/80">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* C) SampleFindingCard */}
        <div
          className="rounded-2xl bg-white p-8"
          style={{
            boxShadow:
              "0 4px 6px rgba(15,30,60,0.06), 0 12px 40px rgba(15,30,60,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
            borderLeft: "3px solid #06B6D4",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{
                background: "#06B6D4",
                boxShadow: "0 0 6px #06B6D4",
              }}
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Sample Finding
            </span>
          </div>
          <p className="mb-4 text-base leading-relaxed text-foreground/85 md:text-lg">
            County baseline suggests this quote sits above expected range for
            comparable scope. Three structural gaps increase the risk that the
            homeowner is paying more while seeing less on paper.
          </p>
          <p className="text-sm italic text-foreground/50">
            This is the kind of signal WindowMan is designed to surface before
            commitment.
          </p>
        </div>
      </div>
    </section>
  );
}
