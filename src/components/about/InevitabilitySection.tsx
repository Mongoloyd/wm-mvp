import SectionEyebrow from "./SectionEyebrow";
import SectionHeading from "./SectionHeading";

const standards = [
  {
    label: "Used Cars",
    standard: "Carfax",
    caption: "A messy, trust-deficient market got a common reference layer.",
    featured: false,
  },
  {
    label: "Real Estate",
    standard: "Zillow",
    caption: "A fragmented decision market got a visible information surface.",
    featured: false,
  },
  {
    label: "Window Contracts",
    standard: "WindowMan",
    caption:
      "A vague, low-standard quoting market gets a contract intelligence layer.",
    featured: true,
  },
];

export default function InevitabilitySection() {
  return (
    <section className="bg-slate-100 px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <SectionEyebrow className="mb-4">THE STANDARD</SectionEyebrow>
          <SectionHeading className="mb-6">
            Every Major Market Eventually Gets a Standard.
          </SectionHeading>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground/80 md:text-lg">
            Used cars got Carfax. Real estate got Zillow. Consumer credit got
            FICO. Home improvement contracts are next. WindowMan is building that
            standard.
          </p>
        </div>

        {/* Standards Ladder */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          {standards.map((item, index) => (
            <div
              key={item.label}
              className="relative flex flex-col rounded-2xl bg-white p-8"
              style={
                item.featured
                  ? {
                      boxShadow:
                        "0 4px 6px rgba(15,30,60,0.08), 0 16px 48px rgba(30,58,138,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
                      border: "1px solid #1E3A8A",
                      borderTop: "2px solid #06B6D4",
                    }
                  : {
                      boxShadow:
                        "0 4px 6px rgba(15,30,60,0.06), 0 12px 40px rgba(15,30,60,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
                      border: "1px solid hsl(214 30% 82%)",
                    }
              }
            >
              {/* Step number */}
              <span
                className="mb-4 inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold"
                style={
                  item.featured
                    ? { background: "#06B6D4", color: "#fff" }
                    : { background: "#e2e8f0", color: "#64748b" }
                }
                aria-hidden="true"
              >
                {index + 1}
              </span>

              {/* Market label */}
              <p
                className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em]"
                style={{ color: item.featured ? "#06B6D4" : "#94a3b8" }}
              >
                {item.label}
              </p>

              {/* Standard name */}
              <h3
                className="mb-4 font-display text-3xl font-extrabold tracking-tight"
                style={
                  item.featured
                    ? { color: "#1E3A8A" }
                    : { color: "hsl(var(--foreground))" }
                }
              >
                {item.standard}
              </h3>

              <p
                className="text-sm leading-relaxed"
                style={{ color: item.featured ? "rgba(30,58,138,0.6)" : "#64748b" }}
              >
                {item.caption}
              </p>

              {item.featured && (
                <div className="mt-6 flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: "#06B6D4",
                      boxShadow: "0 0 6px #06B6D4",
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] tracking-[0.08em] text-foreground/50">
                    BUILDING NOW
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Concluding line */}
        <p className="text-center text-base font-semibold italic text-foreground/60 md:text-lg">
          Markets that lack standards eventually produce them. The only question
          is who builds the reference layer first.
        </p>
      </div>
    </section>
  );
}
