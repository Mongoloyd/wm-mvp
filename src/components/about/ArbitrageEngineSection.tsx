import SectionEyebrow from "./SectionEyebrow";
import SectionHeading from "./SectionHeading";

export default function ArbitrageEngineSection() {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:px-8 md:py-24" style={{ background: "transparent" }}>
      {/* Depth L1 — blue radial field, left (mechanism 01 side) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: "-5%",
          left: "-8%",
          width: "55%",
          height: "90%",
          background: "radial-gradient(ellipse at 30% 45%, rgba(6,182,212,0.09) 0%, rgba(30,80,180,0.07) 45%, transparent 70%)",
          filter: "blur(44px)",
        }}
      />
      {/* Depth L2 — orange underglow, right (arbitrage/pressure side) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: "5%",
          right: "-8%",
          width: "50%",
          height: "75%",
          background: "radial-gradient(ellipse at 70% 65%, rgba(249,115,22,0.07) 0%, rgba(234,88,12,0.04) 45%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <SectionEyebrow className="mb-4">THE SECRET WEAPON</SectionEyebrow>
          <SectionHeading className="mb-6">
            We See Everyone's Homework. That's How We Force Better Prices.
          </SectionHeading>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground/80 md:text-lg">
            Because we process thousands of quotes, we know exactly where the
            fat is hidden. When contractors know they are quoting against the
            WindowMan engine, they stop playing games. They give you their best,
            cleanest price because they know they can't hide bloated margins in
            the fine print.
          </p>
        </div>

        {/* Two heavyweight cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div
            className="flex flex-col rounded-2xl bg-white p-8 md:p-10"
            style={{
              boxShadow:
                "0 4px 8px rgba(10,25,60,0.09), 0 16px 48px rgba(10,25,60,0.14), 0 0 0 1px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <div className="mb-6 flex items-center gap-3">
              <span
                className="inline-block h-1.5 w-10 rounded-full"
                style={{ background: "#06B6D4" }}
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                MECHANISM 01
              </span>
            </div>
            <h3 className="mb-4 font-heading text-2xl font-bold text-foreground md:text-3xl">
              How We Create Pricing Pressure
            </h3>
            <p className="text-base leading-relaxed text-foreground/75">
              We use our data pulse to create leverage. Contractors in our orbit
              know we verify scope, materials, exclusions, and pricing logic. If
              the quote is bloated or weak, the engine flags it. To stay
              competitive, they are pushed toward cleaner structure and sharper
              pricing.
            </p>
            <div className="mt-auto pt-8">
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: "#06B6D4", boxShadow: "0 0 6px #06B6D4" }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] tracking-[0.08em] text-foreground/60">
                  BLOATED MARGIN → ENGINE FLAG → COMPETITIVE PRESSURE
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div
            className="flex flex-col rounded-2xl bg-white p-8 md:p-10"
            style={{
              boxShadow:
                "0 4px 8px rgba(10,25,60,0.09), 0 16px 48px rgba(10,25,60,0.14), 0 0 0 1px rgba(249,115,22,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <div className="mb-6 flex items-center gap-3">
              <span
                className="inline-block h-1.5 w-10 rounded-full"
                style={{ background: "#f97316" }}
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                MECHANISM 02
              </span>
            </div>
            <h3 className="mb-4 font-heading text-2xl font-bold text-foreground md:text-3xl">
              This Is the Arbitrage
            </h3>
            <p className="text-base leading-relaxed text-foreground/75">
              We identify the gap between what a homeowner is being offered and
              what a cleaner, more competitive quote could look like. That gap is
              where WindowMan creates pressure. We do not guess. We compare. Then
              we make the market react.
            </p>
            <div className="mt-auto pt-8">
              <div className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-orange-400"
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] tracking-[0.08em] text-foreground/60">
                  OFFERED PRICE vs. COMPETITIVE BASELINE → SPREAD EXPOSED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Centered statement panel */}
        <div
          className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white px-8 py-6 text-center"
          style={{ boxShadow: "0 2px 12px rgba(15,30,60,0.07)" }}
        >
          <p className="text-base font-semibold leading-relaxed text-foreground/80 md:text-lg">
            This is not Wall Street arbitrage. It is market arbitrage: turning
            quote confusion into pricing pressure.
          </p>
        </div>
      </div>
    </section>
  );
}
