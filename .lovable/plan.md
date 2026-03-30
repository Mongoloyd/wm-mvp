Fix: Build Crash + Report Scroll Alignment1. Fix build crash — missing trackEvent import (CRITICAL)File: src/components/InteractiveDemoScan.tsxLine 81 calls trackEvent({ event_name: event }) but the import is missing. The project uses trackEvent from @/lib/trackEvent.ts (not the suggested trackGtmEvent).Fix: Add import { trackEvent } from "@/lib/trackEvent"; after line 2.2. Improve report scroll targetingFile: src/pages/Index.tsx, line 243Current issue: window.scrollTo({ top: 0, behavior: "smooth" }) scrolls to the hero section instead of the actual report results.Fix: Replace with a targeted scroll to the report container. Add id="truth-report-top" to the report container <div> (around line 252) and update the reveal logic:TypeScriptonRevealComplete={() => {
  setGradeRevealed(true);
  setTimeout(() => {
    document.getElementById("truth-report-top")?.scrollIntoView({ 
      behavior: "smooth", 
      block: "start" 
    });
  }, 100);
}}
Note: Verified that no conflicting scrollIntoView calls exist in TruthReportClassic.tsx. The only scroll logic there is the user-triggered scrollToGate.3. Fix fetchPriority warningFile: src/components/AuditHero.tsx, line 34Revert fetchPriority back to lowercase fetchpriority="high" to satisfy React's DOM attribute requirements and clear console warnings.SummaryFileChangesrc/components/InteractiveDemoScan.tsxAdd missing trackEvent importsrc/pages/Index.tsxTargeted scroll to #truth-report-topsrc/components/AuditHero.tsxFix fetchpriority casing
