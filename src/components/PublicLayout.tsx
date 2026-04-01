import { Outlet } from "react-router-dom";
import PublicNavbar from "@/components/PublicNavbar";
import SiteFooter from "@/components/layout/SiteFooter";

/**
 * PublicLayout — shared layout for public marketing routes.
 *
 * Renders the PublicNavbar above the child route content, and SiteFooter below.
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
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      
      {/* flex-1 makes this middle section expand, pushing the footer down */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* The footer sits perfectly at the bottom */}
      <SiteFooter />
    </div>
  );
}
