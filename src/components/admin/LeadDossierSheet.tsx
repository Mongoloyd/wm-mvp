/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LEAD DOSSIER SHEET — Full lead intelligence side panel
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, MapPin, Hash, DollarSign, Clock,
  AlertTriangle, CheckCircle, ExternalLink, Globe,
} from "lucide-react";
import { format } from "date-fns";

import type { CRMLead, AnalysisFlag, LeadAnalysisData } from "./types";
import { fetchLeadAnalysis } from "@/services/adminDataService";

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

  useEffect(() => {
    if (!open || !lead?.latest_analysis_id) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);
    fetchLeadAnalysis(lead.latest_analysis_id)
      .then((data) => {
        if (!cancelled && data) {
          setAnalysis({
            grade: data.grade ?? null,
            dollar_delta: data.dollar_delta ?? null,
            confidence_score: data.confidence_score ?? null,
            flags: Array.isArray(data.flags) ? data.flags : [],
          });
        }
      })
      .catch((err) => console.error("[Dossier] Failed to fetch analysis:", err))
      .finally(() => { if (!cancelled) setAnalysisLoading(false); });

    return () => { cancelled = true; };
  }, [open, lead?.latest_analysis_id]);

  if (!lead) return null;

  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";
  const redFlags = (analysis?.flags ?? []).filter(
    (f) => f.severity === "Critical" || f.severity === "High"
  );
  const amberFlags = (analysis?.flags ?? []).filter((f) => f.severity === "Medium");

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

        {/* ── 3. Attribution ───────────────────────────────────────── */}
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

        {/* ── 4. Analysis Results ──────────────────────────────────── */}
        <SectionTitle>Analysis Results</SectionTitle>
        {analysisLoading ? (
          <p className="text-xs text-muted-foreground animate-pulse">Loading analysis…</p>
        ) : analysis ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Grade</p>
                <Badge className={`${gradeColor(analysis.grade)} text-sm px-3 py-1`}>
                  {analysis.grade || "—"}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Dollar Delta</p>
                <p className="text-lg font-bold tabular-nums">
                  {analysis.dollar_delta != null
                    ? `${analysis.dollar_delta > 0 ? "+" : ""}$${Math.abs(analysis.dollar_delta).toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Confidence</p>
                <p className="text-sm font-mono">{analysis.confidence_score ?? "—"}%</p>
              </div>
            </div>

            {/* Red Flags */}
            {redFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Red Flags ({redFlags.length})
                </p>
                <ul className="space-y-1">
                  {redFlags.map((f, i) => (
                    <li key={i} className="text-xs bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">
                      <span className="font-medium">{f.flag}</span>
                      {f.detail && <span className="text-muted-foreground ml-1">— {f.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amber Flags */}
            {amberFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Amber Flags ({amberFlags.length})
                </p>
                <ul className="space-y-1">
                  {amberFlags.map((f, i) => (
                    <li key={i} className="text-xs bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
                      <span className="font-medium">{f.flag}</span>
                      {f.detail && <span className="text-muted-foreground ml-1">— {f.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {redFlags.length === 0 && amberFlags.length === 0 && (
              <p className="text-xs text-muted-foreground">No flags found in analysis.</p>
            )}
          </div>
        ) : lead.latest_analysis_id ? (
          <p className="text-xs text-muted-foreground">Could not load analysis data.</p>
        ) : (
          <p className="text-xs text-muted-foreground">No analysis available for this lead.</p>
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
