import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Facebook Conversion Infrastructure ──────────────────────────────────────
// Initialize lead ID immediately (before React renders)
import { getLeadId } from "./lib/useLeadId";
import { captureUtmFromUrl } from "./lib/useUtmCapture";

// Generate persistent lead ID on first visit
getLeadId();

// Capture UTM params from URL immediately (before SPA strips them)
captureUtmFromUrl();

createRoot(document.getElementById("root")!).render(<App />);
