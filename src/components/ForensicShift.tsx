import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Binary,
  Database,
  Eye,
  Loader2,
  Lock,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import { qualifyHomepageLead } from "@/lib/qualifyHomepageLead";

type ForensicState = "idle" | "capture" | "qualifying" | "rejected" | "processing" | "revealed";

type Severity = "low" | "medium" | "high";

type ForensicPreview = {
  forensicConfidence: number;
  homeownerView: {
    summaryBullets: string[];
  };
  machineView: {
    findings: Array<{
      label: string;
      severity: Severity;
      detail: string;
    }>;
  };
};

interface ForensicShiftProps {
  onStartCertifiedAudit: () => void;
}

type StoredQualification = {
  qualified: boolean;
  can_run_ai: boolean;
  lead_id?: string | null;
  source?: string;
  qualified_at?: string;
};

const QUALIFICATION_STORAGE_KEY = "wm_homepage_qualification";
const SAMPLE_QUOTE =
  "Total project: $41,500. Standard installation. 50% deposit at signing. Pricing subject to change after remeasure. Permit and warranty details excluded from this estimate.";

const severityRank: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getStoredQualification(): StoredQualification | null {
  try {
    const raw = sessionStorage.getItem(QUALIFICATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredQualification;
    if (!parsed?.qualified || !parsed?.can_run_ai) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setStoredQualification(payload: StoredQualification) {
  try {
    sessionStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can fail in privacy contexts; we degrade gracefully.
  }
}

function summarizeQuote(rawText: string): string {
  return rawText.replace(/\s+/g, " ").trim().slice(0, 280);
}

function buildForensicPreview(rawText: string): ForensicPreview {
  const text = rawText.toLowerCase();
  const findings: ForensicPreview["machineView"]["findings"] = [];
  let evidenceHits = 0;

  const moneyMatch = text.match(/\$\s?([\d,]+)/);
  const totalPrice = moneyMatch ? Number(moneyMatch[1].replace(/,/g, "")) : null;
  if (totalPrice && totalPrice > 35000) {
    evidenceHits += 2;
    findings.push({
      label: "Pricing Padding Risk",
      severity: "medium",
      detail: "Total quote sits above common retail range and may include hidden buffer margin.",
    });
  }

  const words = rawText.trim().split(/\s+/).filter(Boolean).length;
  if (words < 22) {
    evidenceHits += 2;
    findings.push({
      label: "Vague Scope Risk",
      severity: "high",
      detail: "Scope language is very short and leaves room for later additions.",
    });
  }

  if (/standard\s+installation|subject\s+to\s+remeasure|pricing\s+subject\s+to\s+change|excluded|additional\s+work\s+extra/.test(text)) {
    evidenceHits += 3;
    findings.push({
      label: "Exclusion Language Detected",
      severity: "high",
      detail: "Contract terms include flexible wording that often drives post-signature change orders.",
    });
  }

  const requiredSignals = ["noa", "fl#", "permit", "laminated", "dp", "hvhz"];
  const missingCount = requiredSignals.filter((signal) => !text.includes(signal)).length;
  if (missingCount >= 4) {
    evidenceHits += 2;
    findings.push({
      label: "Compliance Detail Density Low",
      severity: "medium",
      detail: "Key compliance markers (NOA/FL#/permit/DP/HVHZ) are mostly absent from this summary.",
    });
  }

  if (!/warranty|lifetime|transferable/.test(text)) {
    evidenceHits += 1;
    findings.push({
      label: "Warranty Clarity Thin",
      severity: "low",
      detail: "Warranty coverage language is unclear or missing in this quote extract.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      label: "Limited Signal Detected",
      severity: "low",
      detail: "This text has minimal risk clues. Run the full scanner for document-level evidence extraction.",
    });
  }

  const sorted = findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 4);
  const forensicConfidence = clamp(42 + evidenceHits * 9 + Math.min(words, 120) * 0.1, 45, 93);

  return {
    forensicConfidence,
    homeownerView: {
      summaryBullets: [
        "Pricing and scope look understandable at first glance.",
        "Technical compliance details are hard to verify from homeowner-facing language.",
        "Some terms may allow cost drift after contract signature.",
      ],
    },
    machineView: {
      findings: sorted,
    },
  };
}

export default function ForensicShift({ onStartCertifiedAudit }: ForensicShiftProps) {
  const [quoteText, setQuoteText] = useState("");
  const [state, setState] = useState<ForensicState>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<ForensicPreview | null>(null);

  const wordCount = useMemo(() => {
    return quoteText.trim() ? quoteText.trim().split(/\s+/).length : 0;
  }, [quoteText]);

  const launchDeepScan = () => {
    setState("processing");
    setErrorMessage(null);

    window.setTimeout(() => {
      setPreview(buildForensicPreview(quoteText));
      setState("revealed");
    }, 1400);
  };

  const handleSeeMachineView = () => {
    if (wordCount < 8) {
      setErrorMessage("Please add a little more quote context so the preview can detect useful signals.");
      return;
    }

    // Reuse existing homepage qualification storage from prior feeder module.
    const existingQualification = getStoredQualification();
    if (existingQualification) {
      launchDeepScan();
      return;
    }

    setState("capture");
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleLeadSubmit = async (payload: { name: string; email: string; phone: string }) => {
    setState("qualifying");
    setErrorMessage(null);

    const result = await qualifyHomepageLead({
      source: "forensic_shift",
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      context: {
        module: "forensic_shift",
        quote_excerpt: summarizeQuote(quoteText),
        quote_word_count: wordCount,
      },
    });

    if (!result.success) {
      setState("capture");
      setErrorMessage(result.reason || "Qualification is unavailable right now. Please try again.");
      return;
    }

    if (!result.qualified || !result.can_run_ai) {
      setModalOpen(false);
      setState("rejected");
      return;
    }

    setStoredQualification({
      qualified: true,
      can_run_ai: true,
      lead_id: result.lead_id,
      source: "forensic_shift",
      qualified_at: new Date().toISOString(),
    });

    setModalOpen(false);
    launchDeepScan();
  };

  return (
    <section className="mx-auto mt-16 max-w-6xl px-4" id="forensic-shift">
      <div className="rounded-3xl border border-primary/20 bg-card/80 p-6 shadow-[0_18px_60px_hsl(var(--primary)/0.14)] backdrop-blur md:p-9">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Forensic Shift</Badge>
          <Badge variant="outline" className="border-border/70">Machine View Preview</Badge>
        </div>

        <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">What you see vs what the machine sees</h3>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
          Homeowners see surface pricing. The machine looks for hidden scope drift, compliance gaps,
          and exclusion language. This is a preliminary internal signal preview only.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Eye size={14} /> Homeowner sees
            </p>
            <Textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Paste the quote summary, scope notes, exclusions, and payment terms…"
              className="mt-3 min-h-[170px] resize-y border-border/70 bg-card/70"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                onClick={() => setQuoteText(SAMPLE_QUOTE)}
              >
                Use sample quote
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-slate-950 p-5 text-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                <Binary size={14} /> Machine sees
              </p>
              <Database size={15} className="text-cyan-300" />
            </div>

            {state !== "revealed" ? (
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                <p className="flex items-center gap-2 text-sm text-slate-300">
                  <Lock size={15} /> Hidden until qualification is complete
                </p>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>• Exclusion-language graph</li>
                  <li>• Compliance signal density</li>
                  <li>• Scope-drift probability markers</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Preliminary Internal Signals</p>
                <p className="text-sm text-slate-300">Forensic confidence: {preview?.forensicConfidence}%</p>

                {preview?.machineView.findings.map((finding) => (
                  <div key={`${finding.label}-${finding.severity}`} className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-100">{finding.label}</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{finding.severity} severity</p>
                    <p className="mt-1 text-xs text-slate-300">{finding.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {errorMessage && state !== "rejected" && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleSeeMachineView} className="gap-2">
            <ScanSearch size={16} />
            See What The Machine Sees
          </Button>
          <Button variant="outline" onClick={onStartCertifiedAudit}>
            Go to Certified Scanner
          </Button>
        </div>

        {state === "processing" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 size={16} className="animate-spin" />
              Running Deep Scan preview…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mapping exclusion phrases, compliance density, and warranty signal clarity.
            </p>
          </motion.div>
        )}

        {state === "rejected" && (
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <TriangleAlert size={16} />
              Thanks — we’ve received your info. A specialist will review this and text you shortly.
            </p>
          </div>
        )}

        {state === "revealed" && preview && (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-700">Forensic Preview</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-medium">Homeowner summary view</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {preview.homeownerView.summaryBullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4 text-slate-100">
                <p className="text-sm font-medium">Machine view preview</p>
                <p className="mt-1 text-xs text-slate-300">
                  Internal signal count: {preview.machineView.findings.length} findings
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Button onClick={onStartCertifiedAudit} className="gap-2">
                Run Full Certified Scanner Audit
                <ArrowUpRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <LeadCaptureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleLeadSubmit}
        isSubmitting={state === "qualifying"}
        errorMessage={errorMessage}
      />
    </section>
  );
}
