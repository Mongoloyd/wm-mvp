import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeadDossierSheet } from "./LeadDossierSheet";
import type { CRMLead, PipelineStatus } from "./types";
import { derivePipelineStatus } from "./types";

interface ActivePipelineProps {
  leads: CRMLead[];
  isLoading?: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  return `•••-•••-${phone.slice(-4)}`;
}

const STATUS_STYLES: Record<PipelineStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scanning: { label: "Scanning", variant: "secondary" },
  pending_otp: { label: "Pending OTP", variant: "outline" },
  verified: { label: "Verified ✓", variant: "default" },
  webhook_sent: { label: "Webhook Sent", variant: "default" },
  closed_won: { label: "Closed/Won", variant: "default" },
  ghost: { label: "Ghost 👻", variant: "destructive" },
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  F: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function gradeClass(grade: string | null): string {
  if (!grade) return "";
  const letter = grade.charAt(0).toUpperCase();
  return GRADE_COLORS[letter] ?? "";
}

function displayName(lead: CRMLead): string {
  const parts = [lead.first_name, lead.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (lead.email) return lead.email;
  return `Lead ${lead.id.slice(0, 8)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Component ───────────────────────────────────────────────────────── */

export function ActivePipeline({ leads, isLoading }: ActivePipelineProps) {
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading pipeline…
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <p className="text-lg font-medium">No leads yet</p>
        <p className="text-sm">Leads will appear here once homeowners start uploading quotes.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Name / Email</TableHead>
              <TableHead className="min-w-[130px]">Phone</TableHead>
              <TableHead className="w-[80px] text-center">Grade</TableHead>
              <TableHead className="w-[80px] text-center">Windows</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Partner</TableHead>
              <TableHead className="w-[90px] text-right">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const status = derivePipelineStatus(lead);
              const style = STATUS_STYLES[status];
              return (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell>
                    <div className="font-medium text-sm truncate max-w-[220px]">
                      {displayName(lead)}
                    </div>
                    {lead.email && lead.first_name && (
                      <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {lead.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {lead.phone_verified ? (lead.phone_e164 ?? "—") : maskPhone(lead.phone_e164)}
                  </TableCell>
                  <TableCell className="text-center">
                    {lead.grade ? (
                      <Badge className={`text-xs font-bold ${gradeClass(lead.grade)}`}>
                        {lead.grade}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {lead.window_count ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={style.variant} className="text-xs whitespace-nowrap">
                      {style.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.assigned_partner}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(lead.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Lead Dossier Slide-Out */}
      <LeadDossierSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </>
  );
}
