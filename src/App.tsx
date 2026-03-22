import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FacebookConversionProvider } from "@/components/FacebookConversionProvider";

// ── Lazy-loaded routes for code splitting ────────────────────────────────────
// Facebook traffic is 85%+ mobile. Only load the page the user lands on.
// Report pages are heavy (findings, evidence, benchmarks) — split them out.
const Index = lazy(() => import("./pages/Index.tsx"));
const Demo = lazy(() => import("./pages/Demo.tsx"));
const DemoClassic = lazy(() => import("./pages/DemoClassic.tsx"));
const Report = lazy(() => import("./pages/Report.tsx"));
const ReportClassic = lazy(() => import("./pages/ReportClassic.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Minimal loading fallback — matches dark theme, no layout shift
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
          <Route path="/demo" element={<Demo />} />
          <Route path="/demo-classic" element={<DemoClassic />} />
          <Route path="/report/:sessionId" element={<Report />} />
          <Route path="/report/classic/:sessionId" element={<ReportClassic />} />
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
