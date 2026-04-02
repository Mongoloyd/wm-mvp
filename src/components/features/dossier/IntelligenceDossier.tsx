/**
 * PHASE 3: FRONTEND DIAGNOSTIC LAB UI
 * Component: IntelligenceDossier.tsx
 * 
 * Renders the Contractor Closing Kit as a forensic intelligence terminal.
 * Consumes ContractorBriefPayload. Zero data fetching. Strict presentational.
 */

import React from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Shield,
  AlertOctagon,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- TYPE DEFINITIONS (Phase 0 Schema Lock) ---

type FlagSeverity = "CRITICAL" | "WARNING" | "NOTICE";
type ArbitrageStatus = "VERIFIED" | "UNVERIFIED" | "HIGH_RISK_UNVERIFIED";

interface DossierLineItem {
  raw_description: string;
  competitor_unit_price: number | null;
  classified_sub_type: string;
  is_impact_rated: boolean | null;
  brand_identified: string | null;
  county_median_price: number | null;
  arbitrage_delta: number | null;
  arbitrage_status?: ArbitrageStatus;
}

interface RedFlagAction {
  flag_category: string;
  severity: FlagSeverity;
  vulnerability_description: string;
  action_rails: string[];
}

interface ContractorBriefPayload {
  priority_score: number;
  competitor_total_price: number | null;
  price_to_beat: number | null;
  math_discrepancy: boolean;
  scan_confidence_score: number;
  line_items: DossierLineItem[];
  competitive_gap_analysis: RedFlagAction[];
  scan_session_id: string;
  generated_at: string;
  target_county: string | null;
}

// --- UTILITY COMPONENTS ---

const TrustBadge: React.FC<{ status: ArbitrageStatus }> = ({ status }) => {
  if (status === "VERIFIED") {
    return (
      <Badge variant="outline" className="border-emerald-600/30 bg-emerald-950/20 text-emerald-400 font-mono text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        VERIFIED
      </Badge>
    );
  }
  
  if (status === "HIGH_RISK_UNVERIFIED") {
    return (
      <Badge variant="outline" className="border-red-600/40 bg-red-950/30 text-red-400 font-mono text-xs">
        <XCircle className="w-3 h-3 mr-1" />
        HIGH_RISK
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="border-amber-600/40 bg-amber-950/30 text-amber-400 font-mono text-xs">
      <AlertTriangle className="w-3 h-3 mr-1" />
      UNVERIFIED
    </Badge>
  );
};

const SeverityBadge: React.FC<{ severity: FlagSeverity }> = ({ severity }) => {
  const config = {
    CRITICAL: { color: "border-red-600/50 bg-red-950/40 text-red-300", icon: AlertOctagon },
    WARNING: { color: "border-amber-600/50 bg-amber-950/40 text-amber-300", icon: AlertTriangle },
    NOTICE: { color: "border-blue-600/50 bg-blue-950/40 text-blue-300", icon: Info }
  };
  
  const { color, icon: Icon } = config[severity];
  
  return (
    <Badge variant="outline" className={`${color} font-mono text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {severity}
    </Badge>
  );
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDelta = (delta: number | null | undefined, status?: ArbitrageStatus): JSX.Element => {
  if (delta === null || delta === undefined || status === "UNVERIFIED" || status === "HIGH_RISK_UNVERIFIED") {
    return <span className="text-slate-500 font-mono text-sm">—</span>;
  }
  
  const isNegative = delta < 0;
  const Icon = isNegative ? TrendingDown : TrendingUp;
  const colorClass = isNegative 
    ? "text-emerald-400" 
    : "text-red-400";
  
  return (
    <div className={`flex items-center gap-1 ${colorClass} font-mono text-sm font-semibold`}>
      <Icon className="w-4 h-4" />
      <span>{isNegative ? "-" : "+"}{formatCurrency(Math.abs(delta))}</span>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const IntelligenceDossier: React.FC<{ payload: ContractorBriefPayload }> = ({ payload }) => {
  const {
    priority_score,
    competitor_total_price,
    price_to_beat,
    math_discrepancy,
    scan_confidence_score,
    line_items = [],
    competitive_gap_analysis = [],
    target_county,
    generated_at
  } = payload;

  // Compute aggregates
  const totalArbitrageOpportunity = line_items
    .filter(item => item.arbitrage_status === "VERIFIED" && item.arbitrage_delta && item.arbitrage_delta > 0)
    .reduce((sum, item) => sum + (item.arbitrage_delta || 0), 0);

  const criticalFlags = competitive_gap_analysis.filter(f => f.severity === "CRITICAL");
  const warningFlags = competitive_gap_analysis.filter(f => f.severity === "WARNING");

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-slate-950">
      {/* SECTION 1: DIAGNOSTIC HEADER */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-slate-200 text-sm font-normal uppercase tracking-wider mb-1">
                Intelligence Dossier
              </CardTitle>
              <div className="text-slate-500 font-mono text-xs">
                Session: {payload.scan_session_id.slice(0, 8)}
                <span className="mx-2">•</span>
                {new Date(generated_at).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric", 
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
            
            {/* Priority Score - Prominent */}
            <div className="flex flex-col items-end">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Priority</div>
              <div className={`text-6xl font-mono font-bold ${
                priority_score >= 70 ? "text-red-400" : 
                priority_score >= 40 ? "text-amber-400" : 
                "text-blue-400"
              }`}>
                {priority_score}
              </div>
              <div className="text-slate-500 font-mono text-xs mt-1">/100</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Scan Confidence */}
            <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Scan Confidence</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-mono font-bold ${
                  scan_confidence_score >= 80 ? "text-emerald-400" :
                  scan_confidence_score >= 60 ? "text-amber-400" :
                  "text-red-400"
                }`}>
                  {scan_confidence_score}
                </span>
                <span className="text-slate-500 font-mono text-sm">%</span>
              </div>
            </div>

            {/* Math Status */}
            <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Math Integrity</div>
              <div className="flex items-center gap-2 mt-2">
                {math_discrepancy ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="font-mono text-sm text-red-400">FAILED</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-mono text-sm text-emerald-400">VERIFIED</span>
                  </>
                )}
              </div>
            </div>

            {/* Competitor Total */}
            <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Competitor Total</div>
              <div className="text-2xl font-mono font-bold text-slate-200">
                {formatCurrency(competitor_total_price)}
              </div>
            </div>

            {/* Price to Beat */}
            <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Target Price</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {formatCurrency(price_to_beat)}
              </div>
              {price_to_beat && competitor_total_price && (
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Save: {formatCurrency(competitor_total_price - price_to_beat)}
                </div>
              )}
            </div>
          </div>

          {/* County Context */}
          {target_county && (
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Market:</span>
              <span className="font-mono text-slate-200">{target_county} County</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: ARBITRAGE TABLE */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-slate-200 text-sm font-normal uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            Line-Level Arbitrage Analysis
          </CardTitle>
          {totalArbitrageOpportunity > 0 && (
            <div className="text-xs text-slate-500 font-mono mt-1">
              Total Overcharge Detected: <span className="text-red-400 font-bold">{formatCurrency(totalArbitrageOpportunity)}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {line_items.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No line items available for analysis
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-mono text-xs uppercase">Product</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs uppercase">Brand</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs uppercase text-right">Quote Price</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs uppercase text-right">Market Median</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs uppercase text-right">Δ Delta</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs uppercase">Trust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {line_items.map((item, idx) => {
                    const isTrusted = item.arbitrage_status === "VERIFIED";
                    const rowClass = !isTrusted ? "bg-amber-950/10" : "";
                    
                    return (
                      <TableRow key={idx} className={`border-slate-800 hover:bg-slate-800/30 ${rowClass}`}>
                        <TableCell className="font-mono text-sm text-slate-300">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">{item.classified_sub_type}</span>
                            {item.raw_description && (
                              <span className="text-xs text-slate-500 truncate max-w-xs">
                                {item.raw_description}
                              </span>
                            )}
                            {item.is_impact_rated !== null && (
                              <Badge 
                                variant="outline" 
                                className={`w-fit text-xs ${
                                  item.is_impact_rated 
                                    ? "border-blue-600/30 bg-blue-950/20 text-blue-400" 
                                    : "border-slate-700 bg-slate-800/30 text-slate-400"
                                }`}
                              >
                                {item.is_impact_rated ? "Impact Rated" : "Non-Impact"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="font-mono text-sm text-slate-400">
                          {item.brand_identified || <span className="text-slate-600">—</span>}
                        </TableCell>
                        
                        <TableCell className="text-right font-mono text-sm text-slate-200 font-semibold">
                          {formatCurrency(item.competitor_unit_price)}
                        </TableCell>
                        
                        <TableCell className="text-right font-mono text-sm text-slate-400">
                          {isTrusted ? formatCurrency(item.county_median_price) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-right">
                          {formatDelta(item.arbitrage_delta, item.arbitrage_status)}
                        </TableCell>
                        
                        <TableCell>
                          <TrustBadge status={item.arbitrage_status || "UNVERIFIED"} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: VULNERABILITY MATRIX & ACTION RAILS */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-slate-200 text-sm font-normal uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            Competitive Gap Analysis
          </CardTitle>
          <div className="flex gap-4 text-xs font-mono mt-2">
            <div className="text-slate-500">
              Critical: <span className="text-red-400 font-bold">{criticalFlags.length}</span>
            </div>
            <div className="text-slate-500">
              Warning: <span className="text-amber-400 font-bold">{warningFlags.length}</span>
            </div>
            <div className="text-slate-500">
              Total: <span className="text-slate-300 font-bold">{competitive_gap_analysis.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {competitive_gap_analysis.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No vulnerabilities detected
            </div>
          ) : (
            competitive_gap_analysis.map((flag, idx) => (
              <div 
                key={idx} 
                className={`p-4 border rounded-lg ${
                  flag.severity === "CRITICAL" 
                    ? "border-red-800/50 bg-red-950/20" 
                    : flag.severity === "WARNING"
                    ? "border-amber-800/50 bg-amber-950/20"
                    : "border-blue-800/50 bg-blue-950/20"
                }`}
              >
                {/* Flag Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityBadge severity={flag.severity} />
                      <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 font-mono text-xs">
                        {flag.flag_category}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {flag.vulnerability_description}
                    </p>
                  </div>
                </div>

                {/* Action Rails - Checklist Format */}
                {flag.action_rails.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-2 font-mono">
                      Recommended Actions
                    </div>
                    <div className="space-y-2">
                      {flag.action_rails.map((action, actionIdx) => (
                        <div 
                          key={actionIdx} 
                          className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors cursor-pointer group"
                        >
                          <div className={`w-4 h-4 mt-0.5 rounded border-2 flex-shrink-0 ${
                            flag.severity === "CRITICAL"
                              ? "border-red-600/50"
                              : flag.severity === "WARNING"
                              ? "border-amber-600/50"
                              : "border-blue-600/50"
                          } group-hover:border-slate-400 transition-colors`} />
                          <span className="text-slate-300 text-sm group-hover:text-slate-100 transition-colors">
                            {action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Footer Metadata */}
      <div className="text-center text-xs text-slate-600 font-mono">
        This brief contains no homeowner PII • Forensic analysis engine v2.0
      </div>
    </div>
  );
};

export default IntelligenceDossier;
