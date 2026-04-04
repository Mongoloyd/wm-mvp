import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldCheck, Ghost, ArrowDown } from "lucide-react";
import type { CommandCenterKPIs } from "./types";

interface CommandCenterProps {
  kpis: CommandCenterKPIs;
  isLoading?: boolean;
}

export function CommandCenter({ kpis, isLoading }: CommandCenterProps) {
  const cards = [
    {
      title: "Total Scans",
      value: kpis.totalScans,
      icon: Activity,
      description: "Quotes analyzed by AI",
      accent: "text-primary",
    },
    {
      title: "Verified Leads",
      value: kpis.verifiedLeads,
      icon: ShieldCheck,
      description: "Passed OTP — hot & handed off",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Ghost Leads",
      value: kpis.ghostLeads,
      icon: Ghost,
      description: "Scanned but abandoned OTP",
      accent: "text-destructive",
    },
  ] as const;

  const funnelSteps = [
    { label: "Scans Completed", value: kpis.totalScans },
    { label: "Phone Verified", value: kpis.verifiedLeads },
    { label: "Webhooks Delivered", value: kpis.webhooksDelivered },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.accent}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tight ${isLoading ? "animate-pulse text-muted-foreground" : ""}`}>
                {isLoading ? "—" : card.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Funnel Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => {
              const conversionRate =
                i > 0 && funnelSteps[i - 1].value > 0
                  ? Math.round((step.value / funnelSteps[i - 1].value) * 100)
                  : null;
              return (
                <div key={step.label}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1 pl-4">
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      {conversionRate !== null && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          {conversionRate}%
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-md border px-4 py-2.5 bg-card">
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="text-lg font-bold font-mono tabular-nums">
                      {isLoading ? "—" : step.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Health Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Webhook Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pending", value: kpis.webhooksPending, variant: "secondary" as const },
              { label: "Delivered", value: kpis.webhooksDelivered, variant: "default" as const },
              { label: "Failed", value: kpis.webhooksFailed, variant: "destructive" as const },
              { label: "Dead Letter", value: kpis.webhooksDeadLetter, variant: "outline" as const },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 rounded-md border p-3">
                <Badge variant={item.variant} className="text-xs">
                  {item.label}
                </Badge>
                <span className="text-xl font-bold font-mono tabular-nums">
                  {isLoading ? "—" : item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
