import { Link } from "react-router-dom";

export default function AboutHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-100/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        {/* Logo / Wordmark */}
        <Link to="/" className="select-none group relative inline-flex items-center gap-1.5 sm:gap-2 max-w-[45%] sm:max-w-none">
          <span className="relative overflow-hidden inline-flex">
            <span
              role="img"
              aria-label="shield"
              className="text-[16px] sm:text-[20px] transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(37,99,235,0.7)]"
            >
              🛡️
            </span>
          </span>
          <span className="font-display text-sm sm:text-xl" style={{ fontWeight: 800, letterSpacing: "0.02em" }}>
            <span className="text-foreground">WINDOW</span>
            <span style={{ color: "#448df7" }}>MAN</span>
            <sup
              className="text-muted-foreground text-[7px] sm:text-[9px]"
              style={{ fontWeight: 400, letterSpacing: "0.15em", marginLeft: 2, verticalAlign: "super" }}
            >
              .PRO
            </sup>
          </span>
        </Link>

        {/* Sign In Link */}
        <Link
          to="/"
          className="text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
