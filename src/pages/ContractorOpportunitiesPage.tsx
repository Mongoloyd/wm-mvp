import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  CreditCard,
  Search,
  Lock,
  Unlock,
  FileText,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Target,
  TrendingUp,
  LogIn,
  Filter,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PreviewModeBadge } from "@/components/PreviewModeBadge";

/* ── Types ──────────────────────────────────────────────────────── */
interface Opportunity {
  opportunity_id: string;
  route_id: string;
  analysis_id: string;
  lead_id: string;
  county: string | null;
  city: string | null;
  project_type: string | null;
  window_count: number | null;
  quote_range: string | null;
  grade: string | null;
  flag_count: number;
  red_flag_count: number;
  amber_flag_count: number;
  priority_score: number;
  status: string;
  release_status: string;
  already_unlocked: boolean;
  can_unlock: boolean;
  credit_balance: number;
  dossier_href: string;
  has_document: boolean;
  created_at: string;
}

interface Meta {
  credit_balance: number;
  contractor_status: string;
  total: number;
}

type FilterTab = "all" | "unlocked" | "pending" | "released";

/* ── Helpers ────────────────────────────────────────────────────── */
const gradeColor = (g: string | null) => {
  if (!g) return "text-slate-500";
  if (g === "A") return "text-emerald-400";
  if (g === "B") return "text-emerald-300";
  if (g === "C") return "text-amber-400";
  if (g === "D") return "text-orange-400";
  return "text-red-400";
};

const gradeBg = (g: string | null) => {
  if (!g) return "bg-slate-800";
  if (g === "A") return "bg-emerald-500/10 border-emerald-500/30";
  if (g === "B") return "bg-emerald-500/10 border-emerald-500/20";
  if (g === "C") return "bg-amber-500/10 border-amber-500/30";
  if (g === "D") return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
};

const statusPill = (status: string) => {
  const map: Record<string, { label: string; classes: string }> = {
    intro_requested: { label: "New", classes: "bg-sky-500/20 text-sky-300" },
    contractor_interested: { label: "Interested", classes: "bg-violet-500/20 text-violet-300" },
    homeowner_contact_released: { label: "Released", classes: "bg-emerald-500/20 text-emerald-300" },
    closed_won: { label: "Won", classes: "bg-emerald-600/20 text-emerald-400" },
    closed_lost: { label: "Lost", classes: "bg-slate-600/20 text-slate-400" },
  };
  const info = map[status] ?? { label: status.replace(/_/g, " "), classes: "bg-slate-700/50 text-slate-400" };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${info.classes}`}>
      {info.label}
    </span>
  );
};

/* ── Mock data for preview mode ────────────────────────────────── */
const MOCK_OPPORTUNITIES: Opportunity[] = [
  { opportunity_id: "mock-1", route_id: "r1", analysis_id: "a1", lead_id: "l1", county: "Broward", city: "Fort Lauderdale", project_type: "Full Home Replacement", window_count: 12, quote_range: "$18,000–$24,000", grade: "D", flag_count: 4, red_flag_count: 2, amber_flag_count: 2, priority_score: 85, status: "intro_requested", release_status: "pending", already_unlocked: false, can_unlock: false, credit_balance: 5, dossier_href: "/partner/dossier", has_document: true, created_at: new Date().toISOString() },
  { opportunity_id: "mock-2", route_id: "r2", analysis_id: "a2", lead_id: "l2", county: "Miami-Dade", city: "Miami", project_type: "Partial Replacement", window_count: 6, quote_range: "$8,500–$12,000", grade: "C", flag_count: 2, red_flag_count: 1, amber_flag_count: 1, priority_score: 72, status: "contractor_interested", release_status: "pending", already_unlocked: true, can_unlock: true, credit_balance: 5, dossier_href: "/partner/dossier", has_document: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { opportunity_id: "mock-3", route_id: "r3", analysis_id: "a3", lead_id: "l3", county: "Palm Beach", city: "Boca Raton", project_type: "Impact Door + Windows", window_count: 18, quote_range: "$32,000–$45,000", grade: "F", flag_count: 7, red_flag_count: 4, amber_flag_count: 3, priority_score: 94, status: "intro_requested", release_status: "pending", already_unlocked: false, can_unlock: false, credit_balance: 5, dossier_href: "/partner/dossier", has_document: false, created_at: new Date(Date.now() - 172800000).toISOString() },
];
const MOCK_META: Meta = { credit_balance: 5, contractor_status: "preview", total: 3 };

export default function ContractorOpportunitiesPage() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [countyFilter, setCountyFilter] = useState("");

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const body: Record<string, unknown> = {};
      if (activeFilter === "unlocked") body.unlocked_only = true;
      if (activeFilter === "pending") body.release_status = "pending_review";
      if (activeFilter === "released") body.release_status = "released";
      if (countyFilter.trim()) body.county = countyFilter.trim();

      const { data, error: fnErr } = await supabase.functions.invoke(
        "list-contractor-opportunities",
        { body },
      );

      if (fnErr || data?.error === "unauthenticated" || data?.error === "no_contractor_profile") {
        // Fall back to preview mode
        setOpportunities(MOCK_OPPORTUNITIES);
        setMeta(MOCK_META);
        setIsPreview(true);
        return;
      }

      if (data?.error) {
        setOpportunities(MOCK_OPPORTUNITIES);
        setMeta(MOCK_META);
        setIsPreview(true);
        return;
      }

      setOpportunities(data.opportunities ?? []);
      setMeta(data.meta ?? null);
      setIsPreview(false);
    } catch {
      setOpportunities(MOCK_OPPORTUNITIES);
      setMeta(MOCK_META);
      setIsPreview(true);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, countyFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  /* ── Removed auth-blocker — preview mode handles it gracefully ── */

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-slate-600 border-t-sky-400 animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Loading opportunities…</p>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────── */
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-400">{errorMsg}</p>
          <button
            onClick={fetchOpportunities}
            className="px-4 py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived stats ──────────────────────────────────────────── */
  const unlockedCount = opportunities.filter((o) => o.already_unlocked).length;
  const newCount = opportunities.filter((o) => o.status === "intro_requested").length;
  const uniqueCounties = [...new Set(opportunities.map((o) => o.county).filter(Boolean))];

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: `All (${opportunities.length})` },
    { key: "unlocked", label: `Unlocked (${unlockedCount})` },
    { key: "pending", label: "Pending" },
    { key: "released", label: "Released" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                Opportunity Command Center
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">WindowMan Partner Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700/50">
              <CreditCard className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xs font-mono text-slate-300">
                {meta?.credit_balance ?? 0} credit{(meta?.credit_balance ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Stats Row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<LayoutGrid className="h-4 w-4 text-sky-400" />} label="Total" value={opportunities.length} />
          <StatCard icon={<Unlock className="h-4 w-4 text-emerald-400" />} label="Unlocked" value={unlockedCount} />
          <StatCard icon={<Target className="h-4 w-4 text-amber-400" />} label="New Leads" value={newCount} />
          <StatCard icon={<CreditCard className="h-4 w-4 text-violet-400" />} label="Credits" value={meta?.credit_balance ?? 0} />
        </div>

        {/* ─── Filters ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 rounded-lg border border-slate-800 p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeFilter === tab.key
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {uniqueCounties.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              >
                <option value="">All Counties</option>
                {uniqueCounties.sort().map((c) => (
                  <option key={c} value={c!}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ─── Opportunity List ─────────────────────────────────── */}
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-1">No opportunities yet</h3>
            <p className="text-sm text-slate-600 max-w-md">
              When homeowners scan their quotes and match your service area, opportunities will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.opportunity_id} opp={opp} navigate={navigate} />
            ))}
          </div>
        )}
      </main>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer className="text-center text-[11px] text-slate-600 font-mono py-8">
        WindowMan Partner Portal — Contractor Eyes Only
      </footer>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function OpportunityCard({
  opp,
  navigate,
}: {
  opp: Opportunity;
  navigate: (path: string) => void;
}) {
  return (
    <button
      onClick={() => navigate(opp.dossier_href)}
      className="w-full text-left bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900/80 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Top row: grade + location + status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${gradeBg(opp.grade)}`}>
              <span className={`text-lg font-black ${gradeColor(opp.grade)}`}>
                {opp.grade ?? "—"}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white truncate">
                  {opp.project_type ?? "Window Project"}
                </span>
                {statusPill(opp.status)}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-500">
                  {[opp.city, opp.county].filter(Boolean).join(", ") || "Florida"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            {opp.window_count != null && (
              <span className="text-xs text-slate-500">
                <span className="text-slate-300 font-medium">{opp.window_count}</span> openings
              </span>
            )}
            {opp.quote_range && (
              <span className="text-xs text-slate-500">
                <span className="text-slate-300 font-medium">{opp.quote_range}</span>
              </span>
            )}
            {opp.flag_count > 0 && (
              <span className="text-xs text-slate-500">
                <span className="text-red-400 font-medium">{opp.red_flag_count}</span> red ·{" "}
                <span className="text-amber-400 font-medium">{opp.amber_flag_count}</span> amber
              </span>
            )}
            {opp.has_document && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <FileText className="h-3 w-3" /> Doc
              </span>
            )}
          </div>
        </div>

        {/* Right: unlock state + CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {opp.already_unlocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
              <Unlock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Unlocked</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700/50">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Locked</span>
            </div>
          )}

          <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-sky-400 transition-colors" />
        </div>
      </div>
    </button>
  );
}
