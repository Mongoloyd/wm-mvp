import { Outlet } from "react-router-dom";
import PublicNavbar from "@/components/PublicNavbar";
import SiteFooter from "@/components/layout/SiteFooter";
/**
 * PublicLayout — shared layout for public marketing routes.
 *
 * Renders the PublicNavbar above the child route content.
 * Applied to: /about, /contact, /faq, /privacy, /terms, /disclaimer,
 * /how-we-beat-window-quotes, and any future public marketing pages.
 *
 * NOT applied to:
 * - / (Index.tsx renders LinearHeader directly with homepage-specific CTA behaviour)
 * - /admin/*, /demo-classic, /dev/* (internal routes)
 * - /report/classic/:sessionId (has its own report UI)
 */
export default function PublicLayout() {
  return (
    <>
      <PublicNavbar />
      <Outlet />
    </>
  );
}
