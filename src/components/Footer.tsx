import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.35fr_1fr_1fr] md:px-8">
        <div>
          <div className="mb-3 font-heading text-lg font-bold" style={{ letterSpacing: "-0.01em", color: "hsl(210 50% 8%)" }}>WindowMan.PRO</div>
          <p className="max-w-md text-sm leading-relaxed" style={{ color: "hsl(210 20% 35%)" }}>
            Quote intelligence for home improvement contracts. Helping homeowners compare scope, pricing, and risk before they sign.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(210 20% 45%)" }}>Company</h3>
          <nav className="space-y-2.5 text-sm">
            <Link to="/about" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>About</Link>
            <Link to="/contact" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>Contact</Link>
            <Link to="/faq" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>FAQ</Link>
            <Link to="/contractors" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>For Contractors</Link>
          </nav>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(210 20% 45%)" }}>Legal</h3>
          <nav className="space-y-2.5 text-sm">
            <Link to="/privacy" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>Privacy Policy</Link>
            <Link to="/terms" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>Terms of Service</Link>
            <Link to="/disclaimer" className="block transition hover:text-primary" style={{ color: "hsl(210 20% 30%)" }}>Disclaimer</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 md:px-8">
          <p className="text-xs" style={{ color: "hsl(210 15% 50%)" }}>© 2026 WindowMan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
