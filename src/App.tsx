import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FacebookConversionProvider } from "@/components/FacebookConversionProvider";

// ── Lazy-loaded routes ───────────────────────────────────────────────────────
const Index = lazy(() => import("./pages/Index.tsx"));
const ReportClassic = lazy(() => import("./pages/ReportClassic.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Dev/internal only — not linked from any production CTA
const DemoClassic = lazy(() => import("./pages/DemoClassic.tsx"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard.tsx"));

// ── Static content pages ─────────────────────────────────────────────────────
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const FAQ = lazy(() => import("./pages/FAQ.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Disclaimer = lazy(() => import("./pages/Disclaimer.tsx"));
const HowWeBeatWindowQuotes = lazy(() => import("./pages/HowWeBeatWindowQuotes.tsx"));

// Redirect helper: /report/:sessionId → /report/classic/:sessionId
function ReportRedirect() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <Navigate to={`/report/classic/${sessionId}`} replace />;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Loading analysis...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FacebookConversionProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/report/classic/:sessionId" element={<ReportClassic />} />
          {/* Legacy V2 route → permanent redirect to Classic */}
          <Route path="/report/:sessionId" element={<ReportRedirect />} />
          {/* Internal/dev only — zero production CTAs point here */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/demo-classic" element={<DemoClassic />} />
          {/* ── Static content pages ── */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/how-we-beat-window-quotes" element={<HowWeBeatWindowQuotes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </FacebookConversionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
