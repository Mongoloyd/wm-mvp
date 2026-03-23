export default function Contact() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Contact
        </p>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-5xl">
          Need help?
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-7 text-foreground/80">
          For support, account questions, or general inquiries about WindowMan.PRO
          and our forensic quote analysis tools, email our team directly.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="mb-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Support Email
          </p>

          <a
            href="mailto:support@windowman.pro"
            className="text-lg font-medium text-foreground underline decoration-white/20 underline-offset-4 transition hover:text-primary"
          >
            support@windowman.pro
          </a>

          <p className="mt-4 text-sm leading-6 text-foreground/70">
            Support usually responds within 24 hours.
          </p>
        </div>
      </section>
    </main>
  );
}
