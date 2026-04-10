import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { qualifyHomepageLead } from "@/lib/qualifyHomepageLead";
import LeadCaptureModal from "@/components/LeadCaptureModal";

type EngineState = "idle" | "capture" | "qualifying" | "rejected" | "processing" | "revealed";

type DemoSnapshot = {
  safetyScore: number;
  codeMatchScore: number;
  issues: string[];
  isFairDeal: boolean;
};

interface ArbitrageEngineProps {
  onStartCertifiedAudit: () => void;
}

const REQUIRED_MARKERS = [
  { key: "noa", label: "NOA reference" },
  { key: "fl#", label: "FL# product approval" },
  { key: "permit", label: "permit handling" },
  { key: "warranty", label: "warranty scope" },
  { key: "laminated", label: "laminated glass spec" },
] as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createDemoSnapshot(rawText: string): DemoSnapshot {
  const text = rawText.toLowerCase();
  const issues: string[] = [];

  let safetyScore = 82;
  let codeMatchScore = 78;

  // Deterministic heuristics make the demo stable and transparent.
  if (/50\s*%\s*deposit/.test(text)) {
    safetyScore -= 16;
    issues.push("High upfront deposit language detected (50% deposit).");
  }

  if (/subject\s+to\s+remeasure/.test(text)) {
    codeMatchScore -= 10;
    issues.push("Scope includes 'subject to remeasure' terms that can change pricing.");
  }

  if (/price\s+subject\s+to\s+change|change\s+order/.test(text)) {
    safetyScore -= 8;
    codeMatchScore -= 8;
    issues.push("Quote includes change-order / price-adjustment language.");
  }

  const missingMarkers = REQUIRED_MARKERS.filter((marker) => !text.includes(marker.key));
  if (missingMarkers.length > 0) {
    safetyScore -= missingMarkers.length * 5;
    codeMatchScore -= missingMarkers.length * 6;
    issues.push(
      `Missing key documentation signals: ${missingMarkers.map((m) => m.label).join(", ")}.`,
    );
  }

  if (/lifetime\s+warranty|transferable\s+warranty/.test(text)) {
    safetyScore += 6;
    codeMatchScore += 3;
  }

  if (/permit\s+included|permit\s+by\s+contractor/.test(text)) {
    codeMatchScore += 5;
  }

  safetyScore = clampScore(safetyScore);
  codeMatchScore = clampScore(codeMatchScore);

  return {
    safetyScore,
    codeMatchScore,
    issues,
    isFairDeal: safetyScore >= 68 && codeMatchScore >= 64 && issues.length <= 3,
  };
}

function summarizeQuote(rawText: string): string {
  return rawText.replace(/\s+/g, " ").trim().slice(0, 280);
}

export default function ArbitrageEngine({ onStartCertifiedAudit }: ArbitrageEngineProps) {
  const [quoteText, setQuoteText] = useState("");
  const [uiState, setUiState] = useState<EngineState>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (processingTimerRef.current !== null) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, []);

  const quoteWordCount = useMemo(() => {
    return quoteText.trim() ? quoteText.trim().split(/\s+/).length : 0;
  }, [quoteText]);

  const handleAnalyzeClick = () => {
    if (quoteWordCount < 10) {
      setErrorMessage("Please paste a bit more quote detail before running the demo preview.");
      return;
    }

    setErrorMessage(null);
    setUiState("capture");
    setModalOpen(true);
  };

  const handleLeadSubmit = async (payload: { name: string; email: string; phone: string }) => {
    setUiState("qualifying");
    setErrorMessage(null);

    try {
      const result = await qualifyHomepageLead({
        source: "arbitrage_engine",
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        context: {
          quote_excerpt: summarizeQuote(quoteText),
          quote_word_count: quoteWordCount,
          module: "arbitrage_engine",
        },
      });

      if (!result.success) {
        setUiState("capture");
        setErrorMessage(result.reason || "We could not process this request. Please try again.");
        return;
      }

      if (!result.qualified || !result.can_run_ai) {
        setModalOpen(false);
        setUiState("rejected");
        setErrorMessage(null);
        return;
      }

      setModalOpen(false);
      setUiState("processing");

      if (processingTimerRef.current !== null) {
        clearTimeout(processingTimerRef.current);
      }
      // No real AI call in this sprint. We intentionally simulate processing before showing deterministic output.
      processingTimerRef.current = window.setTimeout(() => {
        setSnapshot(createDemoSnapshot(quoteText));
        setUiState("revealed");
      }, 1700);
    } catch (error) {
      console.error("[ArbitrageEngine] qualification error", error);
      setUiState("capture");
      setErrorMessage("We could not process this request. Please try again.");
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-5xl px-4" id="arbitrage-engine">
      <div className="rounded-3xl border border-primary/20 bg-card/80 p-6 shadow-[0_16px_48px_hsl(var(--primary)/0.12)] backdrop-blur md:p-9">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Arbitrage Engine</Badge>
          <Badge variant="outline" className="border-border/70">Demo Risk Snapshot</Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Pressure-test quote language before you commit.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Paste quote text into this sandbox to preview high-risk contract patterns. This is a
              preliminary demo, not the certified WindowMan Truth Report.
            </p>

            <div className="mt-5 space-y-3">
              <Textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Example: 50% deposit due at signing, subject to remeasure, final permit details to follow…"
                className="min-h-[180px] resize-y border-border/70 bg-background/70"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{quoteWordCount} words captured</span>
                <span>Tip: include payment terms, warranty, permit, and product specs.</span>
              </div>
            </div>

            {errorMessage && uiState !== "rejected" && (
              <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleAnalyzeClick} className="min-w-[200px]">
                Run Demo Audit
              </Button>
              <Button variant="outline" onClick={onStartCertifiedAudit}>
                Skip to Certified Scanner
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
            <ul className="mt-4 space-y-3 text-sm text-foreground/90">
              <li className="flex items-start gap-2"><Target size={16} className="mt-0.5 text-primary" /> Detects risky quote terms.</li>
              <li className="flex items-start gap-2"><ShieldAlert size={16} className="mt-0.5 text-primary" /> Requires lead qualification before reveal.</li>
              <li className="flex items-start gap-2"><Sparkles size={16} className="mt-0.5 text-primary" /> Guides you into the full certified audit path.</li>
            </ul>
          </div>
        </div>

        {uiState === "processing" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-5"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 size={16} className="animate-spin" />
              Building your Preliminary Audit Preview…
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Parsing payment terms, code markers, and warranty language from your quote text.
            </p>
          </motion.div>
        )}

        {uiState === "rejected" && (
          <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <TriangleAlert size={16} />
              Thanks — we’ve received your info. A specialist will review this and text you shortly.
            </p>
            <div className="mt-4">
              <Button onClick={onStartCertifiedAudit} variant="outline">
                Start Full Certified Audit Instead
              </Button>
            </div>
          </div>
        )}

        {uiState === "revealed" && snapshot && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Preliminary Audit Preview</p>
            <h4 className="mt-2 text-xl font-semibold">Demo Risk Snapshot</h4>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs text-muted-foreground">Safety score</p>
                <p className="mt-1 text-2xl font-semibold">{snapshot.safetyScore}/100</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs text-muted-foreground">Code-match score</p>
                <p className="mt-1 text-2xl font-semibold">{snapshot.codeMatchScore}/100</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                {snapshot.isFairDeal ? (
                  <><CheckCircle2 size={16} className="text-emerald-600" /> Deal posture looks reasonable</>
                ) : (
                  <><TriangleAlert size={16} className="text-amber-600" /> Elevated contract risk signals found</>
                )}
              </p>

              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {snapshot.issues.length > 0 ? (
                  snapshot.issues.map((issue) => <li key={issue}>{issue}</li>)
                ) : (
                  <li>No major warning language detected in this short sample.</li>
                )}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={onStartCertifiedAudit} className="gap-2">
                Run Full Certified Audit
                <ArrowUpRight size={16} />
              </Button>
              <p className="text-xs text-muted-foreground">
                Use the top scanner to generate your backend-verified Truth Report.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <LeadCaptureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleLeadSubmit}
        isSubmitting={uiState === "qualifying"}
        errorMessage={errorMessage}
      />
    </section>
  );
}
