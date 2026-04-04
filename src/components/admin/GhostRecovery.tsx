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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Ghost, Mail } from "lucide-react";
import { toast } from "sonner";
import { LeadDossierSheet } from "./LeadDossierSheet";
import type { CRMLead } from "./types";

interface GhostRecoveryProps {
  ghosts: CRMLead[];
  isLoading?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function GhostRecovery({ ghosts, isLoading }: GhostRecoveryProps) {
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading ghost leads…
      </div>
    );
  }

  if (!ghosts.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Ghost className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No ghost leads</p>
          <p className="text-sm text-muted-foreground">
            All scanned leads have completed phone verification. 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {ghosts.length} abandoned lead{ghosts.length !== 1 ? "s" : ""} — scanned but never verified
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Name / Email</TableHead>
                  <TableHead className="w-[90px] text-center">Grade</TableHead>
                  <TableHead className="w-[90px] text-center">Windows</TableHead>
                  <TableHead className="w-[90px] text-right">Age</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ghosts.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[220px]">
                        {lead.first_name ?? lead.email ?? `Lead ${lead.id.slice(0, 8)}`}
                      </div>
                      {lead.email && lead.first_name && (
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {lead.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {lead.grade ? (
                        <Badge variant="outline" className="text-xs font-bold">
                          {lead.grade}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {lead.window_count ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(lead.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.email!, "Email"); }}
                          >
                            <Mail className="h-3 w-3" /> Email
                          </Button>
                        )}
                        {lead.phone_e164 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.phone_e164!, "Phone"); }}
                          >
                            <Copy className="h-3 w-3" /> Phone
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LeadDossierSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>
  );
}
