import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Lock,
  Unlock,
  ShieldAlert,
  FileText,
  Target,
  ArrowLeft,
  Crosshair,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Minus,
  CreditCard,
  AlertTriangle,
  ClipboardList,
  Building2,
  Hash,
  MapPin,
  DollarSign,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PreviewModeBadge } from "@/components/PreviewModeBadge";

/* ── tiny helpers ─────────────────────────────────────────────── */
const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString()}` : "N/A";

const PILLAR_LABELS: Record<string, string> = {
  safety: "Safety & Code",
  install: "Install & Scope",
  price: "Price Fairness",
  fine_print: "Fine Print",
  warranty: "Warranty Value",
};

const pillarColor = (score: number) => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const gradeColor = (g: string | null | undefined) => {
  if (!g) return "text-muted-foreground";
  if (g === "A") return "text-emerald-600";
  if (g === "B") return "text-emerald-500";
  if (g === "C") return "text-amber-600";
  if (g === "D") return "text-orange-600";
  return "text-red-600";
};

/* ── Dossier display state ────────────────────────────────────── */
type DossierDisplayState = "locked" | "unlocked" | "preview_locked" | "preview_unlocked";

/* ── Rich mock data for no-id / demo fallback ─────────────────── */
const MOCK_DOSSIER = {
  dossier: {
    lead: {
      id: "mock-lead-id",
      first_name: "Sarah",
      last_name: "M.",
      email: "s••••@gmail.com",
      phone_e164: "•••••••4567",
      city: "Fort Lauderdale",
      state: "FL",
      county: "Broward",
      project_type: "Full Home Replacement",
      quote_range: "$18,000–$24,000",
      window_count: 12,
      estimated_savings_low: 2400,
      estimated_savings_high: 5800,
      intent: "comparing_quotes",
    },
    analysis: {
      id: "mock-analysis-id",
      grade: "D",
      confidence_score: 87,
      document_type: "Contractor Proposal",
      rubric_version: "v3.2",
      created_at: new Date().toISOString(),
      flag_count: 4,
      red_flag_count: 2,
      amber_flag_count: 2,
    },
    extraction: {
      total_quoted_price: 22500,
      total_opening_count: 12,
      project_type: "Full Home Replacement",
      company_name: "••••••••",
    },
    pillar_scores: { safety: 45, install: 38, price: 52, fine_print: 28, warranty: 20 },
    flags: [
      { label: "No Impact Rating Specified", detail: "Quote does not list DP ratings for any windows.", severity: "Critical", pillar: "safety", tip: null },
      { label: "Missing Permit Language", detail: "No mention of building permits or NOA compliance.", severity: "High", pillar: "install", tip: null },
      { label: "Above-Market Pricing", detail: "Price per opening is 34% above Broward County median.", severity: "Medium", pillar: "price", tip: null },
      { label: "No Written Warranty Terms", detail: "Quote mentions 'lifetime warranty' without defining coverage.", severity: "Medium", pillar: "warranty", tip: null },
    ],
    proof_of_read: { pages_scanned: 3, document_hash: "abc123" },
  },
  meta: {
    analysis_id: "mock-analysis-id",
    lead_id: "mock-lead-id",
    contractor_id: null,
    credit_balance: 5,
    already_unlocked: false,
    can_unlock: false,
    contractor_status: "demo",
    masked: true,
  },
};

/* ── Types ─────────────────────────────────────────────────────── */
interface DossierMeta {
  analysis_id: string;
  lead_id: string | null;
  contractor_id: string | null;
  credit_balance: number;
  already_unlocked: boolean;
  can_unlock: boolean;
  contractor_status: string;
  masked: boolean;
}

interface DossierData {
  lead: Record<string, any> | null;
  analysis: Record<string, any>;
  extraction: Record<string, any>;
  pillar_scores: Record<string, number>;
  flags: Array<Record<string, any>>;
  proof_of_read: any;
}

export default function PartnerDossier() {
  const { id } = useParams<{ id: string }>();

  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [meta, setMeta] = useState<DossierMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  /* ── Fallback helper ───────────────────────────────────────────── */
  const fallbackToMock = useCallback(() => {
    setDossier(MOCK_DOSSIER.dossier as any);
    setMeta(MOCK_DOSSIER.meta as any);
    setIsPreview(true);
    setLoading(false);
  }, []);

  /* ── Initialize immediately with mock if no id ───────────────── */
  useEffect(() => {
    if (!id) fallbackToMock();
  }, [id, fallbackToMock]);

  /* ── Fetch dossier via edge function ──────────────────────────── */
  const fetchDossier = useCallback(async () => {
    if (!id) return;

    // Don't block page — render stays with existing data
    let data: any = null;
    try {
      const res = await supabase.functions.invoke("get-contractor-dossier", {
        body: { id },
      });
      if (res.error) { fallbackToMock(); return; }
      data = res.data;
    } catch {
      fallbackToMock();
      return;
    }

    if (!data || data.error === "unauthenticated" || data.error === "internal_error") {
      fallbackToMock();
      return;
    }

    if (data.error === "not_found") {
      setError("Dossier not found for the given ID.");
      return;
    }

    if (data.dossier && data.meta) {
      setDossier(data.dossier);
      setMeta(data.meta);
      setIsPreview(false);
    } else {
      fallbackToMock();
    }
  }, [id, fallbackToMock]);

  useEffect(() => {
    if (id) {
      // Start with mock immediately, then try to fetch real data
      fallbackToMock();
      fetchDossier();
    }
  }, [id, fallbackToMock, fetchDossier]);

  /* ── Unlock handler ──────────────────────────────────────────── */
  const handleUnlock = async () => {
    if (isPreview) {
      // Demo unlock in preview mode
      setMeta((prev) => prev ? { ...prev, masked: false, already_unlocked: true } : prev);
      setDossier((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lead: {
            ...prev.lead,
            first_name: "Sarah",
            last_name: "Martinez",
            email: "sarah.martinez@gmail.com",
            phone_e164: "+19545551234",
          },
        };
      });
      toast.success("Lead unlocked! (Preview mode)");
      return;
    }
    if (!meta?.lead_id) return;
    setUnlocking(true);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("unlock-lead", {
        body: { lead_id: meta.lead_id },
      });

      if (fnErr) {
        toast.error("Unlock failed. Please try again.");
        setUnlocking(false);
        return;
      }

      if (data?.success) {
        toast.success(data.already_unlocked ? "Lead already unlocked." : "Lead unlocked! 1 credit deducted.");
        await fetchDossier();
      } else {
        const code = data?.error_code;
        if (code === "insufficient_credits" || code === "no_credit_account") {
          toast.error("Insufficient credits. Purchase more to continue.");
        } else if (code === "contractor_inactive") {
          toast.error("Your account is suspended. Contact support.");
        } else {
          toast.error(data?.message ?? "Unlock failed.");
        }
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  /* ── Copy helper ───────────────────────────────────────────── */
  const copyText = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  /* ── Hard error state ──────────────────────────────────────── */
  if (error && !dossier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!dossier || !meta) {
    // Show skeleton-like loading
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  /* ── Derived data ──────────────────────────────────────────── */
  const lead = dossier.lead;
  const analysis = dossier.analysis;
  const ext = dossier.extraction;
  const pillarScores = dossier.pillar_scores ?? {};
  const flags = dossier.flags ?? [];
  const isUnlocked = !meta.masked;
  const totalPrice: number | null = ext?.total_quoted_price ?? null;
  const openingCount: number | null = ext?.total_opening_count ?? lead?.window_count ?? null;
  const pricePerOpening =
    totalPrice != null && openingCount && openingCount > 0
      ? Math.round(totalPrice / openingCount)
      : null;

  /* ── Canonical display state ── */
  const displayState: DossierDisplayState = isPreview
    ? (isUnlocked ? "preview_unlocked" : "preview_locked")
    : (isUnlocked ? "unlocked" : "locked");

  const isDisplayUnlocked = displayState === "unlocked" || displayState === "preview_unlocked";

  /* ── Document vault state ── */
  const hasDocument = !!(dossier.proof_of_read || ext?.company_name);

  /* ── Intake intelligence cards ── */
  const intakeCards = [
    { label: "Project Type", value: lead?.project_type ?? ext?.project_type, icon: Building2 },
    { label: "Window Count", value: lead?.window_count != null ? String(lead.window_count) : (openingCount != null ? String(openingCount) : null), icon: Hash },
    { label: "County", value: lead?.county, icon: MapPin },
    { label: "Quote Range", value: lead?.quote_range, icon: DollarSign },
    { label: "Quote Stage", value: lead?.intent?.replace(/_/g, " ") ?? (lead?.quote_range ? "Has Quote" : null), icon: Layers },
  ].filter((c) => c.value != null && c.value !== "");

  /* ── Section styling helpers ── */
  const sectionBase = isDisplayUnlocked
    ? "rounded-xl border border-emerald-200 bg-emerald-50/30 p-6"
    : "rounded-xl border bg-card p-6";

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/partner/opportunities"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mr-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Opportunities</span>
            </Link>
            <Crosshair className="h-6 w-6 text-sky-600" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight leading-none">
                  Intelligence Dossier
                </h1>
                {isPreview && <PreviewModeBadge />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ID&nbsp;{(meta.analysis_id ?? id ?? "demo").slice(0, 8)}…
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit balance badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border">
              <CreditCard className="h-3.5 w-3.5 text-sky-600" />
              <span className="text-xs font-mono">
                {meta.credit_balance} credit{meta.credit_balance !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Unlock button */}
            <button
              onClick={handleUnlock}
              disabled={isDisplayUnlocked || unlocking || (!isPreview && !meta.can_unlock)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${
                  isDisplayUnlocked
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default"
                    : unlocking
                      ? "bg-sky-100 text-sky-700 cursor-wait"
                      : (isPreview || meta.can_unlock)
                        ? "bg-sky-600 text-white hover:bg-sky-500 shadow-md"
                        : "bg-muted text-muted-foreground cursor-not-allowed border"
                }`}
            >
              {isDisplayUnlocked ? (
                <>
                  <Check className="h-4 w-4" /> Lead Unlocked
                </>
              ) : unlocking ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                  Unlocking…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Unlock Lead (1 Credit)
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ─── Lead Provenance ────────────────────────────────────── */}
        <section className={sectionBase}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-sky-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-sky-700">
              Lead Provenance
            </h2>
            {isDisplayUnlocked && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3" /> Unlocked
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InfoRow
              label="Location"
              value={`${lead?.city ?? "—"}, ${lead?.state ?? "FL"}`}
            />
            <InfoRow label="County" value={lead?.county ?? "N/A"} />
            <InfoRow
              label="Lead Name"
              value={`${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`.trim() || "N/A"}
              blur={!isDisplayUnlocked}
            />
            <PiiRow
              label="Phone"
              value={lead?.phone_e164 ?? "N/A"}
              blur={!isDisplayUnlocked}
              onCopy={
                isDisplayUnlocked && lead?.phone_e164
                  ? () => copyText("Phone", lead.phone_e164)
                  : undefined
              }
              copied={copied === "Phone"}
            />
            <PiiRow
              label="Email"
              value={lead?.email ?? "N/A"}
              blur={!isDisplayUnlocked}
              onCopy={
                isDisplayUnlocked && lead?.email
                  ? () => copyText("Email", lead.email)
                  : undefined
              }
              copied={copied === "Email"}
            />
            <InfoRow
              label="Project Type"
              value={lead?.project_type ?? ext?.project_type ?? "N/A"}
            />
          </div>
        </section>

        {/* ─── Lead Intake Intelligence (NEW) ─────────────────────── */}
        {intakeCards.length > 0 && (
          <section className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-violet-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-violet-700">
                Lead Intake Intelligence
              </h2>
            </div>
            <div className={`grid gap-3 ${intakeCards.length >= 5 ? "sm:grid-cols-5" : intakeCards.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
              {intakeCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="bg-muted/50 rounded-lg p-4 border-l-4 border-violet-300"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="h-3.5 w-3.5 text-violet-500" />
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        {card.label}
                      </p>
                    </div>
                    <p className="text-sm font-semibold capitalize">
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Competitive Intelligence ───────────────────────────── */}
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700">
              Competitive Intelligence
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Competitor Grade
              </p>
              <p className={`text-5xl font-black ${gradeColor(analysis?.grade)}`}>
                {analysis?.grade ?? "—"}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total Quoted
              </p>
              <p className="text-2xl font-bold">{fmt(totalPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {openingCount ?? "?"} openings
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Price / Opening
              </p>
              <p className="text-2xl font-bold">
                {pricePerOpening != null ? `$${pricePerOpening.toLocaleString()}` : "N/A"}
              </p>
              {pricePerOpening != null && <MarketIndicator price={pricePerOpening} />}
            </div>
          </div>
        </section>

        {/* ─── Pillar Scores Bar Chart ────────────────────────────── */}
        {Object.keys(pillarScores).length > 0 && (
          <section className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="h-5 w-5 text-violet-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-violet-700">
                Forensic Breakdown
              </h2>
            </div>
            <div className="space-y-3">
              {Object.entries(PILLAR_LABELS).map(([key, label]) => {
                const score = pillarScores[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 text-right font-mono">
                      {label}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pillarColor(score)}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Attack Surface & Vulnerabilities ──────────────────── */}
        <section className="rounded-xl border border-red-200 bg-red-50/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-700">
              Attack Surface &amp; Vulnerabilities
            </h2>
          </div>

          {flags.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              No critical vulnerabilities detected.
            </p>
          ) : (
            <ul className="space-y-3">
              {flags.map((flag: any, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-3 bg-card rounded-lg p-3 border"
                >
                  <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {flag?.label ?? `Flag ${i + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {flag?.detail ?? "—"}
                    </p>
                    {flag?.severity && (
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          flag.severity === "Critical" || flag.severity === "High"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {flag.severity}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ─── Document Vault ─────────────────────────────────────── */}
        <DocumentVault
          hasDocument={hasDocument}
          isUnlocked={isDisplayUnlocked}
          analysisId={meta.analysis_id}
          createdAt={analysis?.created_at}
          isPreview={isPreview}
        />

        {/* ─── Provenance Footer ──────────────────────────────────── */}
        <footer className="text-center text-[11px] text-muted-foreground py-6 space-y-1">
          <p>
            Scanned&nbsp;
            {new Date(analysis?.created_at).toLocaleString()} &middot;
            Rubric&nbsp;{analysis?.rubric_version ?? "—"} &middot;
            Confidence&nbsp;{analysis?.confidence_score ?? "—"}%
          </p>
          <p>WindowMan Intelligence — Contractor Eyes Only</p>
        </footer>
      </main>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function InfoRow({
  label,
  value,
  blur,
}: {
  label: string;
  value: string;
  blur?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-medium ${blur ? "blur-sm select-none transition-all duration-500" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function PiiRow({
  label,
  value,
  blur,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  blur: boolean;
  onCopy?: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p
          className={`text-sm font-medium ${blur ? "blur-sm select-none transition-all duration-500" : ""}`}
        >
          {value}
        </p>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MarketIndicator({ price }: { price: number }) {
  const avg = 2100;
  const diff = ((price - avg) / avg) * 100;
  const abs = Math.abs(Math.round(diff));

  if (abs < 5)
    return (
      <span className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-1">
        <Minus className="h-3 w-3" /> At market
      </span>
    );

  return diff > 0 ? (
    <span className="flex items-center justify-center gap-1 text-[10px] text-red-600 mt-1">
      <TrendingUp className="h-3 w-3" /> {abs}% above market
    </span>
  ) : (
    <span className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 mt-1">
      <TrendingDown className="h-3 w-3" /> {abs}% below market
    </span>
  );
}

function DocumentVault({
  hasDocument,
  isUnlocked,
  analysisId,
  createdAt,
  isPreview,
}: {
  hasDocument: boolean;
  isUnlocked: boolean;
  analysisId: string;
  createdAt: string | undefined;
  isPreview: boolean;
}) {
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const handleViewDocument = async () => {
    if (isPreview) {
      toast.info("Document viewing not available in preview mode.");
      return;
    }
    setDocLoading(true);
    setDocError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "get-contractor-document-url",
        { body: { analysis_id: analysisId } },
      );

      if (fnErr || !data?.success) {
        const msg = data?.message ?? fnErr?.message ?? "Failed to retrieve document.";
        setDocError(msg);
        toast.error(msg);
        return;
      }

      window.open(data.signed_url, "_blank", "noopener,noreferrer");
    } catch {
      setDocError("Network error.");
      toast.error("Network error retrieving document.");
    } finally {
      setDocLoading(false);
    }
  };

  /* State 1: No document exists */
  if (!hasDocument) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Document Vault
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No document on file</p>
          <p className="text-xs text-muted-foreground mt-1">
            The original quote document has not been uploaded for this lead.
          </p>
        </div>
      </section>
    );
  }

  /* State 2: Document exists but locked */
  if (!isUnlocked) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-sky-600" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-sky-700">
            Document Vault
          </h2>
        </div>
        <div className="relative bg-muted/50 rounded-lg p-6 border flex items-center gap-4">
          <div className="blur-md select-none pointer-events-none flex items-center gap-4 flex-1">
            <div className="h-12 w-12 rounded-lg bg-muted" />
            <div>
              <p className="text-sm font-medium">Original_Quote.pdf</p>
              <p className="text-xs text-muted-foreground">
                Scanned {createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
          <Lock className="h-6 w-6 text-muted-foreground absolute right-6" />
        </div>
      </section>
    );
  }

  /* State 3: Document exists and unlocked */
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-emerald-600" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700">
          Document Vault
        </h2>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          <Check className="h-3 w-3" /> Accessible
        </span>
      </div>
      <div className="bg-card rounded-lg p-6 border flex items-center gap-4">
        <FileText className="h-12 w-12 text-sky-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Original_Quote.pdf</p>
          <p className="text-xs text-muted-foreground">
            Scanned {createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
          </p>
          {docError && (
            <p className="text-xs text-red-600 mt-1">{docError}</p>
          )}
        </div>
        <button
          onClick={handleViewDocument}
          disabled={docLoading}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {docLoading ? "Loading…" : "View Original Quote"}
        </button>
      </div>
    </section>
  );
}
