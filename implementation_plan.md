FILE: src/pages/About.tsx
ACTION: CREATE
WHY: Adds a trust-building brand narrative page that explains the product’s purpose in a clear, authoritative voice.

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

FILE: src/pages/Contact.tsx
ACTION: CREATE
WHY: Adds a real support destination that increases legitimacy and gives users a direct help channel.

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

FILE: src/pages/FAQ.tsx
ACTION: CREATE
WHY: Adds a concise trust and objection-handling page that answers the most common pre-conversion questions.

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

FILE: src/pages/Privacy.tsx
ACTION: CREATE
WHY: Adds a standard privacy policy page with explicit assurances around document handling and contractor non-disclosure.

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Privacy Policy
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-6 text-foreground/60">
            Last updated: March 23, 2026
          </p>
        </div>

        <article className="prose prose-invert max-w-none text-base leading-7 text-foreground/90">
          <p>
            WindowMan.PRO (“we,” “us,” or “our”) provides AI-assisted forensic
            quote analysis for homeowners evaluating impact window proposals. This
            Privacy Policy explains how we collect, use, store, and protect your
            information.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We may collect information you provide directly, including your name,
            email address, phone number, property-related information, and
            documents you upload for analysis.
          </p>

          <h2>How We Use Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide quote analysis and educational insights.</li>
            <li>Improve product performance and user experience.</li>
            <li>Respond to support requests and account inquiries.</li>
            <li>
              Connect you with vetted match contractors only if you choose to
              pursue that option.
            </li>
          </ul>

          <h2>Document Processing and Security</h2>
          <p>
            Uploaded documents are processed using secure systems and reasonable
            technical safeguards designed to protect your information. We do not
            share your uploaded quote with the original contractor for the purpose
            of alerting them that you used WindowMan.PRO.
          </p>

          <h2>How We Share Information</h2>
          <p>
            We do not sell your personal information to data brokers. We may share
            limited information with service providers who help us operate the
            platform, maintain infrastructure, deliver support, or process
            analytics. If you choose to be matched with a contractor, we may share
            relevant contact details and project context to facilitate that
            connection.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain information for as long as reasonably necessary to provide
            the service, comply with legal obligations, resolve disputes, and
            enforce our agreements.
          </p>

          <h2>Your Choices</h2>
          <p>
            You may contact us to request access, correction, or deletion of
            certain information, subject to applicable law and operational
            limitations.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our platform may rely on third-party infrastructure, hosting,
            analytics, communications, and storage providers. Their handling of
            data is governed by their own terms and policies where applicable.
          </p>

          <h2>Children’s Privacy</h2>
          <p>
            WindowMan.PRO is not directed to children under 13, and we do not
            knowingly collect personal information from children.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Continued use of
            the platform after changes become effective constitutes acceptance of
            the revised policy.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy may be sent to{" "}
            <a href="mailto:support@windowman.pro">support@windowman.pro</a>.
          </p>
        </article>
      </section>
    </main>
  );
}

FILE: src/pages/Terms.tsx
ACTION: CREATE
WHY: Adds a standard terms page establishing permitted use, limitations, and legal boundaries for the service.

export default function Terms() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Terms of Service
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-6 text-foreground/60">
            Last updated: March 23, 2026
          </p>
        </div>

        <article className="prose prose-invert max-w-none text-base leading-7 text-foreground/90">
          <p>
            These Terms of Service (“Terms”) govern your access to and use of
            WindowMan.PRO. By using the platform, you agree to these Terms.
          </p>

          <h2>Use of the Service</h2>
          <p>
            WindowMan.PRO provides AI-assisted quote analysis, educational
            summaries, and related homeowner decision-support tools. You agree to
            use the service only for lawful purposes and in a manner that does not
            interfere with the operation of the platform.
          </p>

          <h2>No Professional Advice</h2>
          <p>
            The platform does not provide legal, engineering, accounting,
            insurance, financial, or other licensed professional advice. Any
            output should be reviewed with appropriate professionals where needed.
          </p>

          <h2>User Content</h2>
          <p>
            You retain ownership of the content and documents you upload. By
            submitting content, you grant us a limited right to process, analyze,
            store, and display that content as necessary to operate the service.
          </p>

          <h2>Accuracy and Availability</h2>
          <p>
            We aim to provide useful and reliable analysis, but we do not warrant
            that the platform will always be uninterrupted, error-free, or fully
            complete. Outputs may contain inaccuracies or omissions.
          </p>

          <h2>Contractor Matching</h2>
          <p>
            In some cases, we may offer introductions to vetted contractors. Any
            decision to engage a contractor is solely yours. WindowMan.PRO is not
            a party to any contract between you and a contractor unless explicitly
            stated otherwise.
          </p>

          <h2>Prohibited Conduct</h2>
          <ul>
            <li>Uploading unlawful, fraudulent, or misleading content.</li>
            <li>Attempting to reverse engineer, disrupt, or exploit the platform.</li>
            <li>Using the service to violate privacy, contract, or other rights.</li>
          </ul>

          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, WindowMan.PRO and its
            affiliates shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or for any loss arising from your
            use of or reliance on the service.
          </p>

          <h2>Termination</h2>
          <p>
            We reserve the right to suspend or terminate access to the service at
            any time if we believe these Terms have been violated or the platform
            is being misused.
          </p>

          <h2>Changes to the Terms</h2>
          <p>
            We may revise these Terms from time to time. Continued use of the
            platform after updated Terms are posted constitutes acceptance of the
            revised Terms.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these Terms may be directed to{" "}
            <a href="mailto:support@windowman.pro">support@windowman.pro</a>.
          </p>
        </article>
      </section>
    </main>
  );
}

FILE: src/pages/Disclaimer.tsx
ACTION: CREATE
WHY: Adds a clear legal disclaimer that narrows interpretation of the product’s outputs and reduces implied-advice risk.

export default function Disclaimer() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Disclaimer
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Legal Disclaimer
          </h1>
        </div>

        <article className="prose prose-invert max-w-none text-base leading-7 text-foreground/90">
          <p>
            WindowMan.PRO provides AI-driven educational estimates, quote review
            assistance, and informational analysis only.
          </p>

          <p>
            The content, findings, scores, benchmarks, flags, recommendations, and
            outputs generated by the platform are not legally binding and should
            not be interpreted as legal advice, financial advice, insurance
            advice, tax advice, public adjusting advice, contractor advice, or
            structural engineering advice.
          </p>

          <p>
            Any quote analysis presented by WindowMan.PRO is intended to help
            homeowners ask better questions and make more informed decisions. It
            does not replace review by a licensed attorney, engineer, inspector,
            accountant, contractor, or other qualified professional.
          </p>

          <p>
            WindowMan.PRO does not guarantee pricing, code compliance, permitting
            outcomes, product suitability, installation quality, savings, or
            project performance. Real-world conditions, local regulations,
            contract terms, and field measurements may materially affect actual
            results.
          </p>

          <p>
            By using this platform, you acknowledge that you are relying on the
            service at your own discretion and that final purchase, contract, and
            construction decisions remain your responsibility.
          </p>
        </article>
      </section>
    </main>
  );
}

FILE: src/App.tsx
ACTION: EDIT
WHY: Wires the six new static pages into the router so they render inside the existing application shell.

import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Disclaimer from "@/pages/Disclaimer";
import FAQ from "@/pages/FAQ";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
<Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
<Route path="/faq" element={<FAQ />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
<Route path="/disclaimer" element={<Disclaimer />} />

FILE: src/components/Footer.tsx
ACTION: EDIT
WHY: Replaces dead links with real internal routes and removes placeholder navigation so the footer is fully functional.

import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.35fr_1fr_1fr] md:px-8">
        <div>
          <div className="mb-3 text-lg font-semibold tracking-tight">
            WindowMan.PRO
          </div>
          <p className="max-w-md text-sm leading-6 text-foreground/65">
            Forensic Quote Analysis for homeowners who want clarity before they
            sign.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Company
          </h3>
          <nav className="space-y-2 text-sm">
            <Link
              to="/about"
              className="block text-foreground/75 transition hover:text-foreground"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block text-foreground/75 transition hover:text-foreground"
            >
              Contact
            </Link>
            <Link
              to="/faq"
              className="block text-foreground/75 transition hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Legal
          </h3>
          <nav className="space-y-2 text-sm">
            <Link
              to="/privacy"
              className="block text-foreground/75 transition hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="block text-foreground/75 transition hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              to="/disclaimer"
              className="block text-foreground/75 transition hover:text-foreground"
            >
              Disclaimer
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-foreground/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} WindowMan.PRO. All rights reserved.</p>
          <a
            href="mailto:support@windowman.pro"
            className="transition hover:text-foreground"
          >
            support@windowman.pro
          </a>
        </div>
      </div>
    </footer>
  );
}
