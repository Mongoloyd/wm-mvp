import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AnalysisViewModeProvider } from "./state/analysisViewMode";

// Forensic Noir fonts
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/900.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";
import "@fontsource/dm-mono/500.css";

// ── Facebook Conversion Infrastructure ──────────────────────────────────────
// Initialize lead ID immediately (before React renders)
import { getLeadId } from "./lib/useLeadId";
import { captureUtmFromUrl } from "./lib/useUtmCapture";

// Generate persistent lead ID on first visit
getLeadId();

// Capture UTM params from URL immediately (before SPA strips them)
captureUtmFromUrl();

createRoot(document.getElementById("root")!).render(
  <AnalysisViewModeProvider>
    <App />
  </AnalysisViewModeProvider>
);
