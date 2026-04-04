/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM DESK — Power Dialer v1.1
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useMemo, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Phone, PhoneCall, Users, CalendarCheck, Eye, Flag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import type { CRMLead, VoiceFollowupSummary } from "./types";
import { updateLeadDealStatus } from "@/services/adminDataService";
import { LeadDossierSheet } from "./LeadDossierSheet";

/* ── Constants ────────────────────────────────────────────────────────── */

const DEAL_STATUSES = [
  { value: "new", label: "New" },
  { value: "attempted", label: "Attempted" },
  { value: "in_conversation", label: "In-Conversation" },
  { value: "appointment_booked", label: "Appointment Booked" },
  { value: "dead", label: "Dead" },
] as const;

/* ── Grade badge colors ───────────────────────────────────────────────── */

function gradeColor(grade: string | null): string {
  switch (grade) {
    case "A": return "bg-green-500 text-white";
    case "B": return "bg-teal-500 text-white";
    case "C": return "bg-amber-500 text-white";
    case "D": return "bg-orange-500 text-white";
    case "F": return "bg-red-500 text-white";
    default: return "bg-gray-400 text-white";
  }
}

/* ── Pipeline status badge ────────────────────────────────────────────── */

interface StatusBadge {
  label: string;
  className: string;
  rowClass?: string;
}

function derivePipelineBadge(
  lead: CRMLead,
  followup?: VoiceFollowupSummary,
): StatusBadge {
  const pill = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap";

  if (lead.deal_status === "dead")
    return { label: "Dead", className: `${pill} bg-gray-200 text-gray-500`, rowClass: "opacity-40" };
  if (lead.deal_status === "appointment_booked")
    return { label: "Appt Booked", className: `${pill} bg-green-100 text-green-800 ring-1 ring-green-500` };
  if (lead.latest_opportunity_id != null)
    return { label: "Sent to Client", className: `${pill} bg-purple-100 text-purple-800` };
  if (lead.intro_requested_at != null)
    return { label: "Intro Requested", className: `${pill} bg-blue-100 text-blue-800` };
  if (lead.deal_status === "ghosted")
    return { label: "Ghosted", className: `${pill} bg-slate-200 text-slate-600` };
  if (followup?.status === "queued" || followup?.status === "in_progress")
    return { label: "AI Calling", className: `${pill} bg-blue-100 text-blue-700 animate-pulse` };
  if (followup?.call_outcome === "voicemail")
    return { label: "Left Voicemail", className: `${pill} bg-amber-100 text-amber-800` };
  if (followup?.status === "failed" || followup?.call_outcome === "no_answer")
    return { label: "No Answer", className: `${pill} bg-orange-100 text-orange-800` };

  return { label: "New Lead", className: `${pill} border border-border bg-background text-muted-foreground` };
}

/* ── Sort options ─────────────────────────────────────────────────────── */

type SortMode = "default" | "grade_worst" | "flags_most";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "Newest (Default)" },
  { value: "grade_worst", label: "Grade: Worst First" },
  { value: "flags_most", label: "Flags: Most First" },
];

const GRADE_WEIGHT: Record<string, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };

/* ── Props ────────────────────────────────────────────────────────────── */

interface InternalCRMDeskProps {
  leads: CRMLead[];
  isLoading: boolean;
  onStatusChange: () => void;
  latestFollowups?: Record<string, VoiceFollowupSummary>;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function InternalCRMDesk({ leads, isLoading, onStatusChange, latestFollowups = {} }: InternalCRMDeskProps) {
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("default");

  // Filter to phone-verified leads only
  const verified = useMemo(
    () => leads.filter((l) => l.phone_verified && l.latest_analysis_id),
    [leads],
  );

  // Sort: default preserves original logic, new modes layer on top
  const sorted = useMemo(() => {
    return [...verified].sort((a, b) => {
      if (sortMode === "grade_worst") {
        const wA = GRADE_WEIGHT[a.grade ?? ""] ?? 99;
        const wB = GRADE_WEIGHT[b.grade ?? ""] ?? 99;
        if (wA !== wB) return wA - wB;
      }
      if (sortMode === "flags_most") {
        const fA = a.flag_count ?? 0;
        const fB = b.flag_count ?? 0;
        if (fA !== fB) return fB - fA;
      }
      // Default tiebreaker: new deal_status first, then newest
      const aIsNew = !a.deal_status || a.deal_status === "new";
      const bIsNew = !b.deal_status || b.deal_status === "new";
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [verified, sortMode]);

  // KPIs
  const needsFirstCall = verified.filter((l) => !l.deal_status || l.deal_status === "new").length;
  const appointmentsBooked = verified.filter((l) => l.deal_status === "appointment_booked").length;

  const handleDealStatusChange = useCallback(async (leadId: string, newStatus: string) => {
    try {
      await updateLeadDealStatus(leadId, newStatus);
      toast.success(`Status updated to "${DEAL_STATUSES.find((s) => s.value === newStatus)?.label}"`);
      onStatusChange();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(msg);
    }
  }, [onStatusChange]);

  const openDossier = useCallback((lead: CRMLead) => {
    setSelectedLead(lead);
    setDossierOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Summary Strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{verified.length}</p>
              <p className="text-xs text-muted-foreground">Verified Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <PhoneCall className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{needsFirstCall}</p>
              <p className="text-xs text-muted-foreground">Needs First Call</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <CalendarCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{appointmentsBooked}</p>
              <p className="text-xs text-muted-foreground">Appointments Booked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sort Control ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Power Dialer Table ─────────────────────────────────────── */}
      {isLoading && sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Loading leads…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No phone-verified leads yet.
        </div>
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Flags</TableHead>
                  <TableHead className="text-center">Pipeline</TableHead>
                  <TableHead className="text-center">Call Intent</TableHead>
                  <TableHead className="w-[180px]">Deal Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((lead) => {
                  const badge = derivePipelineBadge(lead, latestFollowups[lead.id]);
                  return (
                  <TableRow key={lead.id} className={badge.rowClass ?? ""}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(lead.created_at), "MMM d")}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      {lead.phone_e164 ? (
                        <a
                          href={`tel:${lead.phone_e164}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-sm"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone_e164}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{lead.county || "—"}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${gradeColor(lead.grade)}`}
                      >
                        {lead.grade ?? "?"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {(lead.flag_count ?? 0) > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 ${
                            (lead.flag_count ?? 0) >= 3 ? "ring-2 ring-red-500 animate-pulse" : ""
                          }`}
                        >
                          <Flag className="w-3 h-3" />
                          {lead.flag_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {lead.last_call_intent ? (
                        <Badge variant="secondary" className="text-xs">
                          Requested
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.deal_status || "new"}
                        onValueChange={(val) => handleDealStatusChange(lead.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAL_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-xs">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openDossier(lead)}
                        title="View Lead Dossier"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Dossier Sheet ──────────────────────────────────────────── */}
      <LeadDossierSheet
        lead={selectedLead}
        open={dossierOpen}
        onOpenChange={setDossierOpen}
      />
    </div>
  );
}
