const faqs = [
  {
    question: "How much does it cost?",
    answer:
      "WindowMan.PRO is free for homeowners to use for quote analysis and educational review.",
  },
  {
    question: "Will my contractor know I scanned this?",
    answer:
      "No. Your scan is private. Uploaded documents are processed securely and are not shared with the original contractor. We use encrypted systems designed to protect your information.",
  },
  {
    question: "How accurate is the AI?",
    answer:
      "Our analysis engine benchmarks quote details against thousands of local county and market reference points to surface inconsistencies, omissions, and pricing context. It is designed to improve clarity, not replace human judgment.",
  },
  {
    question: "How do you make money?",
    answer:
      "We only earn a fee if you choose to work with one of our vetted match contractors. Homeowners are never charged to review their quote.",
  },
  {
    question: "Is this legal or engineering advice?",
    answer:
      "No. WindowMan.PRO provides AI-assisted educational analysis and estimate guidance. It is not legal, financial, insurance, or structural engineering advice.",
  },
];

export default function FAQ() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            FAQ
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Common questions
          </h1>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:hidden">
                <div className="flex items-center justify-between gap-4">
                  <span>{item.question}</span>
                  <span className="text-muted-foreground transition group-open:rotate-45">
                    +
                  </span>
                </div>
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/75">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
