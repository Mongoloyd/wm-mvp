/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM DESK — Power Dialer v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Speed-to-lead operator view for phone-verified leads.
 * Shows grade, red flags, call intent, and a workflow status dropdown.
 */

import { useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Phone, PhoneCall, Users, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import type { CRMLead } from "./types";
import { updateLeadDealStatus } from "@/services/adminDataService";

/* ── Constants ────────────────────────────────────────────────────────── */

const DEAL_STATUSES = [
  { value: "new", label: "New" },
  { value: "attempted", label: "Attempted" },
  { value: "in_conversation", label: "In-Conversation" },
  { value: "appointment_booked", label: "Appointment Booked" },
  { value: "dead", label: "Dead" },
] as const;

type DealStatusValue = (typeof DEAL_STATUSES)[number]["value"];

/* ── Grade badge colors ───────────────────────────────────────────────── */

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

/* ── Props ────────────────────────────────────────────────────────────── */

interface InternalCRMDeskProps {
  leads: CRMLead[];
  isLoading: boolean;
  onStatusChange: () => void; // trigger parent refresh
}

/* ── Component ────────────────────────────────────────────────────────── */

export function InternalCRMDesk({ leads, isLoading, onStatusChange }: InternalCRMDeskProps) {
  // Filter to phone-verified leads only
  const verified = useMemo(
    () => leads.filter((l) => l.phone_verified && l.latest_analysis_id),
    [leads],
  );

  // Sort: null/new deal_status first, then most recent
  const sorted = useMemo(() => {
    return [...verified].sort((a, b) => {
      const aIsNew = !a.deal_status || a.deal_status === "new";
      const bIsNew = !b.deal_status || b.deal_status === "new";
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [verified]);

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
                  <TableHead className="text-center">Red Flags</TableHead>
                  <TableHead className="text-center">Call Intent</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((lead) => (
                  <TableRow key={lead.id}>
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
                      <Badge className={`${gradeColor(lead.grade)} text-xs px-2`}>
                        {lead.grade || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {lead.red_flag_count > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {lead.red_flag_count}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">0</span>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
