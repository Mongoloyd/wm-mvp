/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LEAD DOSSIER SHEET — Full lead intelligence side panel
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, Mail, MapPin, Hash, DollarSign, Clock,
  AlertTriangle, CheckCircle, ExternalLink, Globe,
  ChevronDown, ChevronUp, Flag, Info,
  PhoneCall, Calendar, CalendarCheck, RotateCcw, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

import type { CRMLead, AnalysisFlag, LeadAnalysisData } from "./types";
import { fetchLeadAnalysis, fetchLeadVoiceFollowups, invokeAdminData } from "@/services/adminDataService";
import type { VoiceFollowup } from "@/services/adminDataService";

/* ── Helpers ──────────────────────────────────────────────────────────── */

function gradeColor(grade: string | null): string {
  switch (grade) {
    case "A": return "bg-green-600 text-white";
    case "B": return "bg-emerald-500 text-white";
    case "C": return "bg-amber-500 text-white";
    case "D": return "bg-orange-600 text-white";
    case "F": return "bg-destructive text-destructive-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

function scoreToGrade(score: number | null | undefined): string {
  if (score == null) return "—";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function InfoRow({ label, value, icon: Icon }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium break-all">{value || <span className="text-muted-foreground">—</span>}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
      {children}
    </h3>
  );
}

function TimelineEntry({ label, timestamp }: { label: string; timestamp: string | null }) {
  if (!timestamp) return null;
  return (
    <div className="flex items-center gap-2 py-1">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono ml-auto">
        {format(new Date(timestamp), "MMM d, yyyy h:mm a")}
      </span>
    </div>
  );
}

/* ── Pillar Types ─────────────────────────────────────────────────────── */

const PILLAR_CONFIG = [
  { key: "safety", label: "Safety & Code" },
  { key: "install", label: "Install & Scope" },
  { key: "price", label: "Price Fairness" },
  { key: "finePrint", label: "Fine Print" },
  { key: "warranty", label: "Warranty Value" },
] as const;

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0, High: 1, Medium: 2, Low: 3,
};

/* ── Props ────────────────────────────────────────────────────────────── */

interface LeadDossierSheetProps {
  lead: CRMLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function LeadDossierSheet({ lead, open, onOpenChange }: LeadDossierSheetProps) {
  const [analysis, setAnalysis] = useState<LeadAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [auditOpen, setAuditOpen] = useState(true);
  const [showAllFlags, setShowAllFlags] = useState(false);

  // ── Call History state ──
  const [callHistory, setCallHistory] = useState<VoiceFollowup[]>([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);
  const [callHistoryError, setCallHistoryError] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !lead?.latest_analysis_id) {
      setAnalysis(null);
      setAnalysisError(false);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);
    setAnalysisError(false);
    fetchLeadAnalysis(lead.latest_analysis_id)
      .then((data) => {
        if (!cancelled && data) {
          setAnalysis({
            grade: data.grade ?? null,
            dollar_delta: data.dollar_delta ?? null,
            confidence_score: data.confidence_score ?? null,
            flags: Array.isArray(data.flags) ? data.flags : [],
            full_json: data.full_json ?? null,
          });
        }
      })
      .catch((err) => {
        console.error("[Dossier] Failed to fetch analysis:", err);
        if (!cancelled) setAnalysisError(true);
      })
      .finally(() => { if (!cancelled) setAnalysisLoading(false); });

    return () => { cancelled = true; };
  }, [open, lead?.latest_analysis_id]);

  if (!lead) return null;

  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";

  // ── Pillar data from full_json ──
  const fullJson = analysis?.full_json;
  const pillarScores = (fullJson as any)?.pillar_scores as Record<string, number> | null ?? null;
  const extraction = (fullJson as any)?.extraction as Record<string, any> | null ?? null;

  // ── Sorted flags ──
  const sortedFlags = [...(analysis?.flags ?? [])].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );
  const visibleFlags = showAllFlags ? sortedFlags : sortedFlags.slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {name}
            {lead.grade && (
              <Badge className={`${gradeColor(lead.grade)} text-xs px-2`}>
                Grade {lead.grade}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Lead ID: {lead.id.slice(0, 8)}… · Created {format(new Date(lead.created_at), "MMM d, yyyy")}
          </SheetDescription>
        </SheetHeader>

        {/* ── 1. Contact Info ──────────────────────────────────────── */}
        <SectionTitle>Contact Information</SectionTitle>
        <div className="space-y-0.5">
          <InfoRow label="Name" value={name} />
          <InfoRow
            label="Email"
            icon={Mail}
            value={lead.email ? (
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
            ) : null}
          />
          <InfoRow
            label="Phone"
            icon={Phone}
            value={lead.phone_e164 ? (
              <a href={`tel:${lead.phone_e164}`} className="text-primary hover:underline font-mono">
                {lead.phone_e164}
              </a>
            ) : null}
          />
          <InfoRow label="Location" icon={MapPin} value={[lead.county, lead.state, lead.zip].filter(Boolean).join(", ")} />
          <InfoRow
            label="Phone Verified"
            icon={CheckCircle}
            value={lead.phone_verified ? (
              <Badge variant="default" className="bg-green-600 text-white text-[10px]">Verified</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Not Verified</Badge>
            )}
          />
        </div>

        <Separator className="my-3" />

        {/* ── 2. Project Specs ─────────────────────────────────────── */}
        <SectionTitle>Project Specs</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <InfoRow label="Window Count" icon={Hash} value={lead.window_count} />
          <InfoRow label="Project Type" value={lead.project_type} />
          <InfoRow label="Quote Range" value={lead.quote_range} />
          <InfoRow label="Quote Amount" icon={DollarSign} value={lead.quote_amount ? `$${Number(lead.quote_amount).toLocaleString()}` : null} />
        </div>

        <Separator className="my-3" />

        {/* ── 3. Truth Engine Audit ────────────────────────────────── */}
        <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-1 group">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Truth Engine Audit
              </h3>
              {lead.grade && (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${gradeColor(lead.grade)}`}>
                  {lead.grade}
                </span>
              )}
            </div>
            {auditOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2 space-y-4">
            {!lead.latest_analysis_id ? (
              <p className="text-xs text-muted-foreground">No Truth Engine analysis available yet.</p>
            ) : analysisLoading ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
            ) : analysisError ? (
              <p className="text-xs text-destructive">Unable to load Truth Engine audit.</p>
            ) : (
              <>
                {/* ── Summary Row ── */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Confidence</p>
                    <p className="font-mono font-medium">{analysis?.confidence_score ?? "—"}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Dollar Delta</p>
                    <p className="font-bold tabular-nums">
                      {analysis?.dollar_delta != null
                        ? `${analysis.dollar_delta > 0 ? "+" : ""}$${Math.abs(analysis.dollar_delta).toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Flags</p>
                    <p className="font-medium">{analysis?.flags?.length ?? 0}</p>
                  </div>
                </div>

                {/* ── Pillar Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {PILLAR_CONFIG.map(({ key, label }) => {
                    const score = pillarScores?.[key] ?? null;
                    const letterGrade = scoreToGrade(score);
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-border/50 bg-muted/30 p-3 min-w-0"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">
                            {label}
                          </p>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${gradeColor(letterGrade === "—" ? null : letterGrade)}`}>
                            {letterGrade}
                          </span>
                        </div>
                        {score != null ? (
                          <div className="mt-1.5">
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  score >= 80 ? "bg-green-500" :
                                  score >= 65 ? "bg-emerald-500" :
                                  score >= 50 ? "bg-amber-500" :
                                  score >= 35 ? "bg-orange-500" :
                                  "bg-destructive"
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{score}/100</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1">Not analyzed</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Flagged Issues ── */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-semibold">Flagged Issues</span>
                    {sortedFlags.length > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {sortedFlags.length}
                      </Badge>
                    )}
                  </div>
                  {sortedFlags.length === 0 ? (
                    <div className="flex items-center gap-2 py-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-green-600">No critical flags detected</span>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {visibleFlags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 shrink-0 uppercase font-bold ${
                              f.severity === "Critical" || f.severity === "High"
                                ? "bg-destructive/20 text-destructive border border-destructive/30"
                                : f.severity === "Medium"
                                ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {f.severity}
                          </Badge>
                          <span className="text-foreground/80">
                            {f.flag}
                            {f.detail && <span className="text-muted-foreground ml-1">— {f.detail}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {sortedFlags.length > 5 && (
                    <button
                      onClick={() => setShowAllFlags(!showAllFlags)}
                      className="text-[10px] text-primary hover:underline mt-1"
                    >
                      {showAllFlags ? "Show less" : `Show all ${sortedFlags.length} flags`}
                    </button>
                  )}
                </div>

                {/* ── Operator Metadata ── */}
                {(extraction || fullJson) && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                        Extraction Details
                      </span>
                    </div>
                    {extraction?.contractor_name && (
                      <p className="text-xs"><span className="text-muted-foreground">Contractor:</span> {extraction.contractor_name}</p>
                    )}
                    {extraction?.total_quoted_price != null && (
                      <p className="text-xs"><span className="text-muted-foreground">Total Quoted:</span> ${Number(extraction.total_quoted_price).toLocaleString()}</p>
                    )}
                    {extraction?.opening_count != null && (
                      <p className="text-xs"><span className="text-muted-foreground">Openings:</span> {extraction.opening_count}</p>
                    )}
                    {extraction?.document_type && (
                      <p className="text-xs"><span className="text-muted-foreground">Doc Type:</span> {extraction.document_type}</p>
                    )}
                    {(fullJson as any)?.rubric_version && (
                      <p className="text-xs"><span className="text-muted-foreground">Rubric:</span> v{(fullJson as any).rubric_version}</p>
                    )}
                    {(fullJson as any)?.price_fairness && (
                      <p className="text-xs"><span className="text-muted-foreground">Price Fairness:</span> {(fullJson as any).price_fairness}</p>
                    )}
                    {(fullJson as any)?.markup_estimate && (
                      <p className="text-xs"><span className="text-muted-foreground">Markup Est:</span> {(fullJson as any).markup_estimate}</p>
                    )}
                    {(fullJson as any)?.negotiation_leverage && (
                      <p className="text-xs"><span className="text-muted-foreground">Leverage:</span> {(fullJson as any).negotiation_leverage}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-3" />

        {/* ── 4. Attribution ───────────────────────────────────────── */}
        <SectionTitle>Attribution & Source</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <InfoRow label="UTM Source" icon={Globe} value={lead.utm_source} />
          <InfoRow label="UTM Medium" value={lead.utm_medium} />
          <InfoRow label="UTM Campaign" value={lead.utm_campaign} />
          <InfoRow label="GCLID" value={lead.gclid ? `${lead.gclid.slice(0, 16)}…` : null} />
          <InfoRow label="FBCLID" value={lead.fbclid ? `${lead.fbclid.slice(0, 16)}…` : null} />
          <InfoRow label="Referrer" value={lead.initial_referrer} />
        </div>
        {lead.landing_page_url && (
          <div className="mt-1">
            <InfoRow
              label="Landing Page"
              icon={ExternalLink}
              value={
                <span className="text-xs font-mono break-all">{lead.landing_page_url}</span>
              }
            />
          </div>
        )}

        <Separator className="my-3" />

        {/* ── 5. Activity Timeline ─────────────────────────────────── */}
        <SectionTitle>Activity Timeline</SectionTitle>
        <div className="space-y-0.5">
          <TimelineEntry label="Lead Created" timestamp={lead.created_at} />
          <TimelineEntry label="Phone Verified" timestamp={lead.phone_verified_at} />
          <TimelineEntry label="Report Unlocked" timestamp={lead.report_unlocked_at} />
          <TimelineEntry label="Intro Requested" timestamp={lead.intro_requested_at} />
          <TimelineEntry label="Last Updated" timestamp={lead.updated_at} />
        </div>

        <div className="h-8" />
      </SheetContent>
    </Sheet>
  );
}
