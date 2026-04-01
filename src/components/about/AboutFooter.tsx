import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Contact", to: "/contact" },
];

export default function AboutFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60">
          © {new Date().getFullYear()} WindowMan.PRO
        </p>
        <nav aria-label="Footer">
          <ul className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
