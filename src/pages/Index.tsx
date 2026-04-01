import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LinearHeader from "@/components/LinearHeader";
import AuditHero from "@/components/AuditHero";
import FlowBEntry from "@/components/FlowBEntry";
import MarketBaselineTool from "@/components/MarketBaselineTool";
import ForensicChecklist from "@/components/ForensicChecklist";
import QuoteWatcher from "@/components/QuoteWatcher";
import SocialProofStrip from "@/components/SocialProofStrip";
import TruthGateFlow from "@/components/TruthGateFlow";
import UploadZone from "@/components/UploadZone";
import ScanTheatrics from "@/components/ScanTheatrics";
import { PostScanReportSwitcher } from "@/components/post-scan/PostScanReportSwitcher";
// ContractorMatch removed — CTAs now native in TruthReportClassic
import IndustryTruth from "@/components/IndustryTruth";
import ProcessSteps from "@/components/ProcessSteps";
import NarrativeProof from "@/components/NarrativeProof";
import ClosingManifesto from "@/components/ClosingManifesto";
import MarketMakerManifesto from "@/components/MarketMakerManifesto";
import StickyRecoveryBar from "@/components/StickyRecoveryBar";
import InteractiveDemoScan from "@/components/InteractiveDemoScan";
import ExitIntentModal from "@/components/ExitIntentModal";
import ScamConcernImage from "@/components/ScamConcernImage";
import StickyCTAFooter from "@/components/StickyCTAFooter";
import Footer from "@/components/Footer";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useHomepageVariant } from "@/hooks/useHomepageVariant";
import { ScanFunnelProvider } from "@/state/scanFunnel";
import { getVerifiedAccess, clearVerifiedAccess } from "@/lib/verifiedAccess";
import { trackEvent } from "@/lib/trackEvent";

import { Skeleton } from "@/components/ui/skeleton";
import DevPreviewPanel from "@/dev/DevPreviewPanel";
const DevQuoteGenerator = import.meta.env.DEV
  ? React.lazy(() => import("@/components/dev/DevQuoteGenerator").then(m => ({ default: m.DevQuoteGenerator })))
  : null;
import { DEV_PREVIEW_CONFIGS, type DevPreviewState } from "@/dev/fixtures";
import { AlertTriangle, RotateCcw, FileX } from "lucide-react";

const Index = () => {
  // ═══ DEV MODE: Uses Vite's built-in dev/prod flag ═══
  const IS_DEV_MODE = import.meta.env.DEV;

  const variant = useHomepageVariant();

  const [devState, setDevState] = useState<DevPreviewState>("none");

  const [flowMode, setFlowMode] = useState<'A' | 'B'>('A');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [truthGateHighlight, setTruthGateHighlight] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [gradeRevealed, setGradeRevealed] = useState(false);
  // contractorMatchVisible removed — CTAs now native in TruthReportClassic
  const [flowBLeadCaptured, setFlowBLeadCaptured] = useState(false);
  const [baselineRevealed, setBaselineRevealed] = useState(false);
  const [quoteWatcherSet, setQuoteWatcherSet] = useState(false);
  const [flowBAnswers, setFlowBAnswers] = useState({ county: "", windowCount: "", windowType: "", appointmentDate: "", appointmentTime: "" });
  const [powerToolTriggered, setPowerToolTriggered] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [selectedCounty, setSelectedCounty] = useState("your county");
  const [recoveryBarDismissed, setRecoveryBarDismissed] = useState(() => localStorage.getItem("wm_recovery_bar_dismissed") === "true");
  const [scrolledPast70, setScrolledPast70] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(false);

  // Dev preview overrides
  const isDevPreview = IS_DEV_MODE && devState !== "none";
  const devConfig = isDevPreview ? DEV_PREVIEW_CONFIGS[devState] : null;
  const showReportFromDev = isDevPreview && devConfig?.analysisData != null && !devConfig?.specialState;
  const { data: analysisData, isLoading: analysisLoading, error: analysisError, fetchFull, isFullLoaded, tryResume, isResuming } = useAnalysisData(scanSessionId, fileUploaded || !!scanSessionId);

  // ── Returning user resume: check localStorage on mount ────────────────
  const resumeCheckedRef = useRef(false);
  useEffect(() => {
    if (resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('resume') !== '1') return;
    const record = getVerifiedAccess();
    if (!record) return;
    setScanSessionId(record.scan_session_id);
    setFileUploaded(true);
    setGradeRevealed(true);
    setLeadCaptured(true);
  }, []);

  // After scanSessionId is set from resume, try auto-fetching full data
  useEffect(() => {
    if (!scanSessionId || isFullLoaded || isResuming) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('resume') !== '1') return;
    const record = getVerifiedAccess(scanSessionId);
    if (!record) return;
    tryResume();
  }, [scanSessionId, isFullLoaded, isResuming, tryResume]);

  useEffect(() => { const timer = setTimeout(() => setTimeOnPage(true), 30000); return () => clearTimeout(timer); }, []);
  useEffect(() => { const handleScroll = () => { const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight; if (scrollPercent >= 0.7) setScrolledPast70(true); }; window.addEventListener("scroll", handleScroll, { passive: true }); return () => window.removeEventListener("scroll", handleScroll); }, []);

  const anyLeadCaptured = flowMode === 'A' ? leadCaptured : flowBLeadCaptured;
  const conversionType: 'scan' | 'account' | null = (leadCaptured || flowBLeadCaptured) ? 'account'
    : gradeRevealed ? 'scan'
    : null;
  const flowBComplete = flowMode === 'B' && quoteWatcherSet;
  const showRecoveryBar = IS_DEV_MODE ? false : (scrolledPast70 && !anyLeadCaptured && timeOnPage && !recoveryBarDismissed && !gradeRevealed && !flowBComplete);

  const pendingScrollRef = useRef(false);

  const scrollToTruthGate = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById("truth-gate");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const triggerTruthGate = (source: string) => {
    trackEvent({ event_name: "cta_scan_funnel", session_id: sessionId, metadata: { source } });
    if (gradeRevealed) { setGradeRevealed(false); setFileUploaded(false); }
    if (flowMode !== 'A') {
      setFlowMode('A');
      pendingScrollRef.current = true;
    } else {
      // Already in flow A with no report — scroll immediately
      scrollToTruthGate();
    }
    setTruthGateHighlight(true);
  };

  useEffect(() => {
    if (pendingScrollRef.current && flowMode === 'A' && !gradeRevealed) {
      pendingScrollRef.current = false;
      scrollToTruthGate();
    }
  }, [flowMode, gradeRevealed, scrollToTruthGate]);

  // Auto-scroll removed — CTA auto-scroll is now handled natively in TruthReportClassic

  const switchToFlowA = (triggeredFrom: string) => { setFlowMode('A'); pendingScrollRef.current = true; };

  // Resolve active data: dev fixtures override real backend data
  const activeData = showReportFromDev ? devConfig!.analysisData : analysisData;
  
  const reportGrade = activeData?.grade || "C";
  const reportFlags = activeData?.flags || [];
  const shouldShowReport = showReportFromDev || gradeRevealed;

  return (
    <ScanFunnelProvider>
    <div className="min-h-screen bg-background">
      <LinearHeader onCtaClick={() => triggerTruthGate('header_cta')} />

      {/* ─── DEV: Special states (invalid doc, bad upload) ─── */}
      {isDevPreview && devConfig?.specialState === "invalid_document" && (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div style={{ background: "white", border: "1.5px solid #FECACA", borderRadius: 14, padding: "40px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FileX size={28} style={{ color: "#DC2626" }} />
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F1F35", marginBottom: 8 }}>
              This Doesn't Appear to Be a Window Quote
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 24 }}>
              Our scanner analyzed your document but couldn't identify it as a window or door quote. This might be a general invoice, contract, or unrelated document.
            </p>
            <button onClick={() => setDevState("none")}
              style={{ background: "#0F1F35", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 10, border: "none", cursor: "pointer" }}>
              <span className="flex items-center gap-2 justify-center"><RotateCcw size={16} /> Upload a Different Document</span>
            </button>
          </div>
        </div>
      )}

      {isDevPreview && devConfig?.specialState === "needs_better_upload" && (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div style={{ background: "white", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "40px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertTriangle size={28} style={{ color: "#D97706" }} />
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F1F35", marginBottom: 8 }}>
              We Need a Clearer Image
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 16 }}>
              The uploaded file is too blurry or low-resolution for our scanner to read accurately. For best results:
            </p>
            <ul style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#374151", textAlign: "left", maxWidth: 360, margin: "0 auto 24px", lineHeight: 2 }}>
              <li>📄 Use the original PDF if you have one</li>
              <li>📸 Take a photo in good lighting, flat on a table</li>
              <li>🔍 Make sure all text is legible and not cut off</li>
            </ul>
            <button onClick={() => setDevState("none")}
              style={{ background: "#0F1F35", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 10, border: "none", cursor: "pointer" }}>
              <span className="flex items-center gap-2 justify-center"><RotateCcw size={16} /> Try Again</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Normal acquisition flow (hidden when dev preview active) ─── */}
      {!shouldShowReport && !isDevPreview && (
        <>
          <AnimatePresence mode="wait">
            {flowMode === 'A' ? (
              <motion.div key="flow-a-hero" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <AuditHero
                  onFlowBClick={() => { setFlowMode('B'); setTimeout(() => { document.getElementById("flow-b")?.scrollIntoView({ behavior: "smooth" }); }, 400); }}
                  onUploadQuote={() => triggerTruthGate('hero_scan_cta')}
                  triggerPowerTool={powerToolTriggered}
                  onPowerToolClose={() => setPowerToolTriggered(false)}
                  variantHeadline={variant.headline}
                  variantSubheadline={variant.subheadline}
                  variantBadgeText={variant.badgeText}
                />
              </motion.div>
            ) : (
              <motion.div key="flow-b-entry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <FlowBEntry onContinueToTool={() => { document.getElementById("market-baseline")?.scrollIntoView({ behavior: "smooth" }); }} onSwitchToFlowA={() => switchToFlowA('hero_switch')} />
                <ScamConcernImage />
                <MarketBaselineTool />
                {flowBLeadCaptured && (
                  <>
                    <ForensicChecklist onUploadQuote={() => switchToFlowA('checklist_cta')} onSetReminder={() => document.getElementById("quote-watcher")?.scrollIntoView({ behavior: "smooth" })} />
                    <QuoteWatcher onReminderSet={(date, time) => { setQuoteWatcherSet(true); setFlowBAnswers(prev => ({ ...prev, appointmentDate: date, appointmentTime: time })); }} onSwitchToFlowA={() => switchToFlowA('watcher_link')} onViewChecklist={() => document.getElementById("forensic-checklist")?.scrollIntoView({ behavior: "smooth" })} />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {flowMode === 'A' && (
            <>
              <SocialProofStrip />
              <ScamConcernImage />
              <InteractiveDemoScan onScanClick={() => triggerTruthGate('demo_scan')} />
              <TruthGateFlow
                onLeadCaptured={(sid) => { setLeadCaptured(true); setSessionId(sid); }}
                onStepChange={(step, county) => { setStepsCompleted(step); setSelectedCounty(county); }}
                highlight={truthGateHighlight}
                onHighlightDone={() => setTruthGateHighlight(false)}
              />
              <UploadZone isVisible={leadCaptured} sessionId={sessionId || undefined} onScanStart={(_fileName, ssId) => { trackEvent({ event_name: "scan_started", session_id: ssId, metadata: { file_name: _fileName } }); setScanSessionId(ssId); setFileUploaded(true); }} />
            </>
          )}
        </>
      )}

      {fileUploaded && !gradeRevealed && !isDevPreview && (
        <ScanTheatrics isActive={true} selectedCounty={selectedCounty} scanSessionId={scanSessionId} grade={analysisData?.grade} analysisData={analysisData}
          onRevealComplete={() => { setGradeRevealed(true); setTimeout(() => { document.getElementById("truth-report-top")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100); }}
          onInvalidDocument={() => { setFileUploaded(false); setScanSessionId(null); }}
          onNeedsBetterUpload={() => { setFileUploaded(false); setScanSessionId(null); }}
        />
      )}

      {/* ─── Report view (real or dev fixture) ─── */}
      {shouldShowReport && (
        <>
           <div id="truth-report-top" className="max-w-4xl mx-auto px-4 pt-4 flex justify-end">
            <button
              onClick={() => {
                clearVerifiedAccess();
                setScanSessionId(null);
                setFileUploaded(false);
                setGradeRevealed(false);
                setLeadCaptured(false);
              }}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm text-muted-foreground text-sm font-medium transition-all duration-200 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
            >
              <RotateCcw size={14} className="transition-transform duration-300 group-hover:-rotate-180" />
              Start New Scan
            </button>
          </div>
        </>
      )}
      {shouldShowReport && (
        <>
          {!showReportFromDev && analysisLoading ? (
            <div className="max-w-4xl mx-auto py-16 px-4 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-[120px] h-[120px] rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : !showReportFromDev && (analysisError || !analysisData) ? (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
              <div className="rounded-xl border border-border bg-card p-8">
                <p className="text-lg font-semibold text-foreground mb-2">Analysis Not Found</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {analysisError || "We couldn't locate the analysis for this scan. The scan may still be processing."}
                </p>
                <button onClick={() => triggerTruthGate('retry_after_error')}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  Try Scanning Again
                </button>
              </div>
            </div>
          ) : activeData ? (
              <PostScanReportSwitcher
                grade={reportGrade}
                flags={reportFlags}
                pillarScores={activeData.pillarScores}
                contractorName={activeData.contractorName}
                county={selectedCounty}
                confidenceScore={activeData.confidenceScore}
                documentType={activeData.documentType}
                
                qualityBand={activeData.qualityBand}
                hasWarranty={activeData.hasWarranty}
                hasPermits={activeData.hasPermits}
                pageCount={activeData.pageCount}
                lineItemCount={activeData.lineItemCount}
                onSecondScan={() => triggerTruthGate('second_opinion_scan')}
                scanSessionId={scanSessionId}
                flagCount={activeData?.flagCount}
                flagRedCount={activeData?.flagRedCount}
                flagAmberCount={activeData?.flagAmberCount}
                isFullLoaded={isFullLoaded}
                onVerified={(phoneE164: string) => { fetchFull(phoneE164); }}
              />
          ) : null}
        </>
      )}

      {!shouldShowReport && !isDevPreview && (
        <>
          <IndustryTruth onScanClick={() => triggerTruthGate('industry_truth')} onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <div className="wm-bridge-strip py-3" />
          <MarketMakerManifesto onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <ProcessSteps onScanClick={() => triggerTruthGate('process_steps')} onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <div className="wm-bridge-strip py-3" />
          <NarrativeProof onScanClick={() => triggerTruthGate('narrative_proof')} onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <ClosingManifesto onScanClick={() => triggerTruthGate('closing_manifesto')} onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}

      <ExitIntentModal stepsCompleted={stepsCompleted} flowMode={flowMode as 'A' | 'B' | 'C'} leadCaptured={leadCaptured} flowBLeadCaptured={flowBLeadCaptured} county={selectedCounty}
        answers={{ windowCount: null, projectType: null, county: selectedCounty !== "your county" ? selectedCounty : null, quoteStage: null, firstName: null, email: null, phone: null }}
        onClose={() => {}} onCTAClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      <StickyRecoveryBar stepsCompleted={stepsCompleted} county={selectedCounty} isVisible={showRecoveryBar} onDismiss={() => setRecoveryBarDismissed(true)}
        flowMode={flowMode} flowBLeadCaptured={flowBLeadCaptured} quoteWatcherSet={quoteWatcherSet}
        onDemoCTAClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        leadCaptured={leadCaptured} isDevMode={IS_DEV_MODE} gradeRevealed={gradeRevealed}
        onContractorMatchClick={() => { document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" }); }} />

      <StickyCTAFooter
        onScanClick={() => triggerTruthGate('sticky_footer')}
        onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onPostConversionClick={() => { window.location.href = 'tel:+15614685571'; }}
        isVisible={!showRecoveryBar}
        conversionType={conversionType}
      />

      {/* Dev-only preview panel */}
      {IS_DEV_MODE && <DevPreviewPanel currentState={devState} onChange={setDevState} />}
      {import.meta.env.DEV && DevQuoteGenerator && (
        <Suspense fallback={null}>
          <DevQuoteGenerator
            sessionId={sessionId}
            onScanStart={(fileName, scanId) => {
              setScanSessionId(scanId);
              setFileUploaded(true);
            }}
          />
        </Suspense>
      )}
      <div className="bg-card pb-[240px] sm:pb-[180px] lg:pb-32">
        <Footer />
      </div>
    </div>
    </ScanFunnelProvider>
  );
};

export default Index;
