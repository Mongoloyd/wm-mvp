/**
 * ReportVersionToggle — Floating button to switch between V2 and Classic report views.
 *
 * Reads the current URL to determine which version is active,
 * then links to the other version preserving the sessionId.
 *
 * Purely presentational — no business logic, no side effects.
 */

import { useLocation, Link } from "react-router-dom";

interface ReportVersionToggleProps {
  sessionId?: string;
}

export function ReportVersionToggle({ sessionId }: ReportVersionToggleProps) {
  const { pathname } = useLocation();

  if (!sessionId) return null;

  const isClassic = pathname.startsWith("/report/classic/");

  const targetPath = isClassic
    ? `/report/${sessionId}`
    : `/report/classic/${sessionId}`;

  const label = isClassic ? "Switch to V2" : "Switch to Classic";

  return (
    <Link
      to={targetPath}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 50,
        background: "#0A0A0A",
        color: "#E5E7EB",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        padding: "10px 18px",
        borderRadius: 9999,
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "background 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(200,149,42,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#0A0A0A";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
      }}
    >
      <span style={{ fontSize: 15 }}>&#x1F504;</span>
      {label}
    </Link>
  );
}
