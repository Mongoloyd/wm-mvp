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
          <Route path="/demo-classic" element={<DemoClassic />} />
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
