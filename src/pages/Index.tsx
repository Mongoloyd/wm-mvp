import { useState, useEffect, useRef } from "react";
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
import TruthReport from "@/components/TruthReport";
import ContractorMatch from "@/components/ContractorMatch";
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
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useReportAccess } from "@/hooks/useReportAccess";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  // ═══ DEV MODE: Set to true to force full unlocked report UI ═══
  const IS_DEV_MODE = true;

  const [flowMode, setFlowMode] = useState<'A' | 'B'>('A');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [truthGateHighlight, setTruthGateHighlight] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [gradeRevealed, setGradeRevealed] = useState(false);
  const [contractorMatchVisible, setContractorMatchVisible] = useState(false);
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

  const { data: analysisData, isLoading: analysisLoading, error: analysisError } = useAnalysisData(scanSessionId, gradeRevealed);
  const reportAccess = useReportAccess({ forceLevel: IS_DEV_MODE ? "full" : undefined });

  useEffect(() => { const timer = setTimeout(() => setTimeOnPage(true), 30000); return () => clearTimeout(timer); }, []);
  useEffect(() => { const handleScroll = () => { const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight; if (scrollPercent >= 0.7) setScrolledPast70(true); }; window.addEventListener("scroll", handleScroll, { passive: true }); return () => window.removeEventListener("scroll", handleScroll); }, []);

  const anyLeadCaptured = flowMode === 'A' ? leadCaptured : flowBLeadCaptured;
  const conversionType: 'scan' | 'account' | null = (leadCaptured || flowBLeadCaptured) ? 'account'
    : gradeRevealed ? 'scan'
    : null;
  const flowBComplete = flowMode === 'B' && quoteWatcherSet;
  const showRecoveryBar = IS_DEV_MODE ? false : (scrolledPast70 && !anyLeadCaptured && timeOnPage && !recoveryBarDismissed && !gradeRevealed && !flowBComplete);

  const pendingScrollRef = useRef(false);

  const triggerTruthGate = (source: string) => {
    if (gradeRevealed) { setGradeRevealed(false); setFileUploaded(false); setContractorMatchVisible(false); }
    if (flowMode !== 'A') setFlowMode('A');
    pendingScrollRef.current = true;
    setTruthGateHighlight(true);
  };

  useEffect(() => {
    if (pendingScrollRef.current && flowMode === 'A' && !gradeRevealed) {
      requestAnimationFrame(() => { requestAnimationFrame(() => { const el = document.getElementById("truth-gate"); if (el) { el.scrollIntoView({ behavior: "smooth" }); pendingScrollRef.current = false; } }); });
    }
  }, [flowMode, gradeRevealed]);

  const switchToFlowA = (triggeredFrom: string) => { setFlowMode('A'); pendingScrollRef.current = true; };

  const reportGrade = analysisData?.grade || "C";
  const reportFlags = analysisData?.flags || [];
  const redFlagCount = reportFlags.filter(f => f.severity === "red").length;
  const amberCount = reportFlags.filter(f => f.severity === "amber").length;
  const greenCount = reportFlags.filter(f => f.severity === "green").length;

  return (
    <div className="min-h-screen bg-background pb-[240px] sm:pb-[180px] lg:pb-32">
      <LinearHeader />

      {!gradeRevealed && (
        <>
          <AnimatePresence mode="wait">
            {flowMode === 'A' ? (
              <motion.div key="flow-a-hero" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <AuditHero
                  onFlowBClick={() => { setFlowMode('B'); setTimeout(() => { document.getElementById("flow-b")?.scrollIntoView({ behavior: "smooth" }); }, 400); }}
                  onUploadQuote={() => triggerTruthGate('power_tool_demo')}
                  triggerPowerTool={powerToolTriggered}
                  onPowerToolClose={() => setPowerToolTriggered(false)}
                />
              </motion.div>
            ) : (
              <motion.div key="flow-b-entry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <FlowBEntry onContinueToTool={() => { document.getElementById("market-baseline")?.scrollIntoView({ behavior: "smooth" }); }} onSwitchToFlowA={() => switchToFlowA('hero_switch')} />
                <ScamConcernImage />
                <MarketBaselineTool
                  onStepComplete={(step, answer) => setStepsCompleted(step)}
                  onLeadCaptured={(answers) => { setFlowBLeadCaptured(true); setFlowBAnswers(prev => ({ ...prev, ...answers })); }}
                  onBaselineRevealed={() => setBaselineRevealed(true)}
                  onChecklistClick={() => document.getElementById("forensic-checklist")?.scrollIntoView({ behavior: "smooth" })}
                  onReminderClick={() => document.getElementById("quote-watcher")?.scrollIntoView({ behavior: "smooth" })}
                />
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
              <UploadZone isVisible={leadCaptured} sessionId={sessionId || undefined} onScanStart={(_fileName, ssId) => { setScanSessionId(ssId); setFileUploaded(true); }} />
            </>
          )}
        </>
      )}

      {fileUploaded && !gradeRevealed && (
        <ScanTheatrics isActive={true} selectedCounty={selectedCounty} scanSessionId={scanSessionId}
          onRevealComplete={() => { setGradeRevealed(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onInvalidDocument={() => { setFileUploaded(false); setScanSessionId(null); }}
          onNeedsBetterUpload={() => { setFileUploaded(false); setScanSessionId(null); }}
        />
      )}

      {gradeRevealed && (
        <>
          {analysisLoading ? (
            <div className="max-w-4xl mx-auto py-16 px-4 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-[120px] h-[120px] rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : analysisError || !analysisData ? (
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
          ) : (
            <>
              <TruthReport
                grade={reportGrade}
                flags={reportFlags}
                pillarScores={analysisData.pillarScores}
                contractorName={analysisData.contractorName}
                county={selectedCounty}
                confidenceScore={analysisData.confidenceScore}
                documentType={analysisData.documentType}
                accessLevel={reportAccess}
                onContractorMatchClick={() => { setContractorMatchVisible(true); setTimeout(() => { document.getElementById("contractor-match")?.scrollIntoView({ behavior: "smooth" }); }, 100); }}
                onSecondScan={() => triggerTruthGate('second_opinion_scan')}
              />
              <ContractorMatch isVisible={contractorMatchVisible} county={selectedCounty} grade={reportGrade} />
            </>
          )}
        </>
      )}

      {!gradeRevealed && (
        <>
          <IndustryTruth onScanClick={() => triggerTruthGate('industry_truth')} onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <MarketMakerManifesto onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <ProcessSteps onScanClick={() => triggerTruthGate('process_steps')} onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
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
        onContractorMatchClick={() => { setContractorMatchVisible(true); setTimeout(() => { document.getElementById("contractor-match")?.scrollIntoView({ behavior: "smooth" }); }, 100); }} />

      <StickyCTAFooter
        onScanClick={() => triggerTruthGate('sticky_footer')}
        onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onPostConversionClick={() => { window.location.href = 'tel:+15614685571'; }}
        isVisible={!showRecoveryBar}
        conversionType={conversionType}
      />
    </div>
  );
};

export default Index;
