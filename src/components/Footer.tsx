import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.35fr_1fr_1fr] md:px-8">
        <div>
          <div className="mb-3 text-lg font-semibold tracking-tight text-slate-900">WindowMan.PRO</div>
          <p className="max-w-md text-sm leading-6 text-slate-700">Forensic Quote Analysis for homeowners who want clarity before they sign.</p>
        </div>
        <div>
          <h3 className="wm-meta mb-3 text-slate-900">Company</h3>
          <nav className="space-y-2 text-sm">
            <Link to="/about" className="block text-slate-600 transition hover:text-slate-900">About</Link>
            <Link to="/contact" className="block text-slate-600 transition hover:text-slate-900">Contact</Link>
            <Link to="/faq" className="block text-slate-600 transition hover:text-slate-900">FAQ</Link>
          </nav>
        </div>
        <div>
          <h3 className="wm-meta mb-3 text-slate-900">Legal</h3>
          <nav className="space-y-2 text-sm">
            <Link to="/privacy" className="block text-slate-600 transition hover:text-slate-900">Privacy Policy</Link>
            <Link to="/terms" className="block text-slate-600 transition hover:text-slate-900">Terms of Service</Link>
            <Link to="/disclaimer" className="block text-slate-600 transition hover:text-slate-900">Disclaimer</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} WindowMan.PRO. All rights reserved.</p>
          <a href="mailto:support@windowman.pro" className="transition hover:text-slate-900">support@windowman.pro</a>
        </div>
      </div>
    </footer>
  );
}
