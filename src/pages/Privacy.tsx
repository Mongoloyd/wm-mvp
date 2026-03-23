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
            WindowMan.PRO ("we," "us," or "our") provides AI-assisted forensic
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

          <h2>Children's Privacy</h2>
          <p>
            WindowMan.PRO is not directed to children under 13, and we do not
            knowingly collect personal information from children under 13.
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
