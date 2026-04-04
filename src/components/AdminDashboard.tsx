/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LEAD SNIPER CRM — Admin Dashboard v3.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Clean 4-tab CRM replacing the legacy multi-contractor marketplace dashboard.
 * Tabs: Command Center · Active Pipeline · Ghost Recovery · Engine Room
 *
 * Data flows through a single fetch cycle with 30-second auto-refresh.
 * All leads are mapped to CRMLead with an assigned_partner default.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { CommandCenter } from "@/components/admin/CommandCenter";
import { ActivePipeline } from "@/components/admin/ActivePipeline";
import { GhostRecovery } from "@/components/admin/GhostRecovery";
import { EngineRoom } from "@/components/admin/EngineRoom";
import { InternalCRMDesk } from "@/components/admin/InternalCRMDesk";

import {
  invokeAdminData,
  fetchLeadEvents,
  fetchWebhookDeliveries,
} from "@/services/adminDataService";

import type { CRMLead, LeadEvent, WebhookDelivery, CommandCenterKPIs } from "@/components/admin/types";

const REFRESH_INTERVAL_MS = 30_000;

/* ── Map raw DB row → CRMLead ────────────────────────────────────────── */

function toLeadCRM(raw: Record<string, any>): CRMLead {
  return {
    id: raw.id,
    session_id: raw.session_id,
    first_name: raw.first_name ?? null,
    last_name: raw.last_name ?? null,
    email: raw.email ?? null,
    phone_e164: raw.phone_e164 ?? null,
    county: raw.county ?? null,
    state: raw.state ?? null,
    zip: raw.zip ?? null,
    grade: raw.grade ?? null,
    grade_score: raw.grade_score ?? null,
    window_count: raw.window_count ?? null,
    quote_amount: raw.quote_amount ?? null,
    phone_verified: raw.phone_verified ?? false,
    phone_verified_at: raw.phone_verified_at ?? null,
    latest_analysis_id: raw.latest_analysis_id ?? null,
    latest_scan_session_id: raw.latest_scan_session_id ?? null,
    latest_opportunity_id: raw.latest_opportunity_id ?? null,
    status: raw.status ?? null,
    funnel_stage: raw.funnel_stage ?? null,
    flag_count: raw.flag_count ?? 0,
    red_flag_count: raw.red_flag_count ?? 0,
    amber_flag_count: raw.amber_flag_count ?? 0,
    critical_flag_count: raw.critical_flag_count ?? 0,
    confidence_score: raw.confidence_score ?? null,
    lead_score: raw.lead_score ?? null,
    scan_count: raw.scan_count ?? 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    deal_status: raw.deal_status ?? null,
    last_call_intent: raw.last_call_intent ?? null,
    assigned_partner: "Primary Client",
  };
}

function toWebhookDelivery(raw: Record<string, any>): WebhookDelivery {
  return {
    id: raw.id,
    lead_id: raw.lead_id,
    event_type: raw.event_type,
    status: raw.status,
    attempt_count: raw.attempt_count ?? 0,
    max_attempts: raw.max_attempts ?? 5,
    last_http_status: raw.last_http_status ?? null,
    last_error: raw.last_error ?? null,
    last_attempt_at: raw.last_attempt_at ?? null,
    next_retry_at: raw.next_retry_at ?? null,
    webhook_url: raw.webhook_url ?? null,
    payload_json: raw.payload_json ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

/* ── Compute KPIs ────────────────────────────────────────────────────── */

function computeKPIs(leads: CRMLead[], deliveries: WebhookDelivery[]): CommandCenterKPIs {
  const totalScans = leads.filter((l) => l.latest_analysis_id).length;
  const verifiedLeads = leads.filter((l) => l.phone_verified && l.latest_analysis_id).length;
  const ghostLeads = leads.filter((l) => l.latest_analysis_id && !l.phone_verified).length;

  return {
    totalScans,
    verifiedLeads,
    ghostLeads,
    webhooksPending: deliveries.filter((d) => d.status === "pending").length,
    webhooksDelivered: deliveries.filter((d) => ["delivered", "mock_delivered"].includes(d.status)).length,
    webhooksFailed: deliveries.filter((d) => d.status === "failed").length,
    webhooksDeadLetter: deliveries.filter((d) => d.status === "dead_letter").length,
  };
}

/* ── Dashboard Shell ─────────────────────────────────────────────────── */

function DashboardContent() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [rawLeads, rawDeliveries] = await Promise.all([
        invokeAdminData("fetch_leads"),
        fetchWebhookDeliveries(),
      ]);
      setLeads((rawLeads ?? []).map(toLeadCRM));
      setDeliveries((rawDeliveries ?? []).map(toWebhookDelivery));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      if (!silent) toast.error(msg);
      console.error("[CRM] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + 30s polling
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  const handleFetchLeadEvents = useCallback(async (leadId: string): Promise<LeadEvent[]> => {
    return (await fetchLeadEvents(leadId)) ?? [];
  }, []);

  const kpis = computeKPIs(leads, deliveries);
  const ghosts = leads.filter((l) => l.latest_analysis_id && !l.phone_verified);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Lead Sniper CRM</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {leads.length} leads · auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                Syncing…
              </Badge>
            )}
            <Link
              to="/admin/settings"
              className="rounded-md p-2 hover:bg-muted transition-colors"
              title="Admin Settings"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="command" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="command">Command Center</TabsTrigger>
            <TabsTrigger value="pipeline">Active Pipeline</TabsTrigger>
            <TabsTrigger value="ghosts" className="relative">
              Ghost Recovery
              {ghosts.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] px-1 text-[10px]">
                  {ghosts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="engine">Engine Room</TabsTrigger>
          </TabsList>

          <TabsContent value="command">
            <CommandCenter kpis={kpis} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="pipeline">
            <ActivePipeline
              leads={leads}
              isLoading={isLoading}
              onFetchLeadEvents={handleFetchLeadEvents}
            />
          </TabsContent>

          <TabsContent value="ghosts">
            <GhostRecovery ghosts={ghosts} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="engine">
            <EngineRoom deliveries={deliveries} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Exported with AuthGuard ─────────────────────────────────────────── */

export default function AdminDashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
