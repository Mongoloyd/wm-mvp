export default function About() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            About WindowMan.PRO
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Built to bring clarity to an opaque industry.
          </h1>
        </div>

        <div className="prose prose-invert max-w-none text-base leading-7 text-foreground/90">
          <p>
            WindowMan.PRO exists to give homeowners a private, intelligent second
            opinion before they sign a major impact window contract. The goal is
            simple: more transparency, fewer surprises, and better decisions.
          </p>

          <p>
            Impact window projects are expensive, technical, and often difficult
            for homeowners to compare apples-to-apples. Scope details, product
            specs, permitting assumptions, financing language, and installation
            exclusions can all materially affect the real value of a quote.
            WindowMan.PRO was built to make those hidden variables easier to
            understand.
          </p>

          <p>
            Our analysis tools are designed to keep both sides honest. Homeowners
            deserve a clearer view of what they are being offered, and reputable
            contractors deserve a market where trust is earned through
            transparency instead of confusion.
          </p>

          <p>
            WindowMan.PRO was shaped by Florida homeowners who understand the
            realities of storm protection, permitting pressure, and high-stakes
            home improvement decisions. We believe better information creates
            better outcomes for everyone involved.
          </p>

          <p>
            This platform is not built to create fear. It is built to reduce
            uncertainty. When homeowners can review quotes with more confidence,
            they make faster, cleaner, more informed buying decisions.
          </p>
        </div>
      </section>
    </main>
  );
}
