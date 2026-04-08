import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Lock,
  Unlock,
  ShieldAlert,
  FileText,
  Target,
  Crosshair,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── tiny helper ─────────────────────────────────────────────── */
const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString()}` : "N/A";

const PILLAR_LABELS: Record<string, string> = {
  safety: "Safety & Code",
  install: "Install & Scope",
  price: "Price Fairness",
  fine_print: "Fine Print",
  warranty: "Warranty Value",
};

const pillarColor = (score: number) => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const gradeColor = (g: string | null | undefined) => {
  if (!g) return "text-slate-400";
  if (g === "A") return "text-emerald-400";
  if (g === "B") return "text-emerald-300";
  if (g === "C") return "text-amber-400";
  if (g === "D") return "text-orange-400";
  return "text-red-400";
};

export default function PartnerDossier() {
  const { id } = useParams<{ id: string }>();

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  /* ── fetch analysis + joined lead ──────────────────────────── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("analyses")
        .select("*, leads(*)")
        .eq("id", id)
        .maybeSingle();
      if (err) setError(err.message);
      else if (!data) setError("Analysis not found.");
      else setAnalysis(data);
      setLoading(false);
    })();
  }, [id]);

  /* ── copy helper ───────────────────────────────────────────── */
  const copyText = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  /* ── derived data ──────────────────────────────────────────── */
  const lead: any = analysis?.leads;
  const ext: any = analysis?.full_json?.extraction ?? {};
  const pillarScores: Record<string, number> =
    (analysis?.full_json?.pillar_scores as Record<string, number>) ?? {};
  const flags: any[] = Array.isArray(analysis?.flags) ? analysis.flags : [];
  const totalPrice: number | null = ext?.total_quoted_price ?? null;
  const openingCount: number | null =
    ext?.total_opening_count ?? lead?.window_count ?? null;
  const pricePerOpening =
    totalPrice != null && openingCount && openingCount > 0
      ? Math.round(totalPrice / openingCount)
      : null;

  /* ── loading / error states ────────────────────────────────── */
  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-slate-600 border-t-sky-400 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <p className="text-red-400 font-mono text-sm">{error}</p>
      </div>
    );

  /* ── render ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* ─── Header & Paywall ─────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crosshair className="h-6 w-6 text-sky-400" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                WindowMan Intelligence Dossier
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID&nbsp;{id?.slice(0, 8)}…
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUnlocked(true)}
            disabled={isUnlocked}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${
                isUnlocked
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 cursor-default"
                  : "bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/25 animate-pulse"
              }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="h-4 w-4" /> Lead Unlocked
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Unlock Lead (1 Credit)
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ─── Section 2: Lead Provenance ────────────────────────── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-sky-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-sky-400">
              Lead Provenance
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InfoRow
              label="Location"
              value={`${lead?.city ?? "—"}, ${lead?.state ?? "FL"}`}
            />
            <InfoRow label="County" value={lead?.county ?? "N/A"} />
            <InfoRow
              label="Lead Name"
              value={`${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`.trim() || "N/A"}
              blur={!isUnlocked}
            />
            <PiiRow
              label="Phone"
              value={lead?.phone_e164 ?? "N/A"}
              blur={!isUnlocked}
              onCopy={
                isUnlocked && lead?.phone_e164
                  ? () => copyText("Phone", lead.phone_e164)
                  : undefined
              }
              copied={copied === "Phone"}
            />
            <PiiRow
              label="Email"
              value={lead?.email ?? "N/A"}
              blur={!isUnlocked}
              onCopy={
                isUnlocked && lead?.email
                  ? () => copyText("Email", lead.email)
                  : undefined
              }
              copied={copied === "Email"}
            />
            <InfoRow
              label="Project Type"
              value={lead?.project_type ?? ext?.project_type ?? "N/A"}
            />
          </div>
        </section>

        {/* ─── Section 3: Competitive Intelligence ───────────────── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">
              Competitive Intelligence
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Grade */}
            <div className="bg-slate-800/60 rounded-lg p-4 text-center border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Competitor Grade
              </p>
              <p
                className={`text-5xl font-black ${gradeColor(analysis?.grade)}`}
              >
                {analysis?.grade ?? "—"}
              </p>
            </div>

            {/* Total Quoted */}
            <div className="bg-slate-800/60 rounded-lg p-4 text-center border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Total Quoted
              </p>
              <p className="text-2xl font-bold text-white">
                {fmt(totalPrice)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {openingCount ?? "?"} openings
              </p>
            </div>

            {/* Price Per Opening */}
            <div className="bg-slate-800/60 rounded-lg p-4 text-center border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Price / Opening
              </p>
              <p className="text-2xl font-bold text-white">
                {pricePerOpening != null
                  ? `$${pricePerOpening.toLocaleString()}`
                  : "N/A"}
              </p>
              {pricePerOpening != null && (
                <MarketIndicator price={pricePerOpening} />
              )}
            </div>
          </div>
        </section>

        {/* ─── Pillar Scores Bar Chart ───────────────────────────── */}
        {Object.keys(pillarScores).length > 0 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="h-5 w-5 text-violet-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400">
                Forensic Breakdown
              </h2>
            </div>
            <div className="space-y-3">
              {Object.entries(PILLAR_LABELS).map(([key, label]) => {
                const score = pillarScores[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-28 shrink-0 text-right font-mono">
                      {label}
                    </span>
                    <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pillarColor(score)}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-mono w-8 text-right">
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Section 4: Sniper Strategy ────────────────────────── */}
        <section className="rounded-xl border border-red-900/40 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-400">
              Attack Surface &amp; Vulnerabilities
            </h2>
          </div>

          {flags.length === 0 ? (
            <p className="text-slate-500 text-sm italic">
              No critical vulnerabilities detected.
            </p>
          ) : (
            <ul className="space-y-3">
              {flags.map((flag: any, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/40"
                >
                  <ShieldAlert className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {flag?.label ?? flag?.flag_key ?? `Flag ${i + 1}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {flag?.detail ?? flag?.description ?? "—"}
                    </p>
                    {flag?.severity && (
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          flag.severity === "Critical" || flag.severity === "High"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {flag.severity}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ─── Section 5: Document Vault ──────────────────────────── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-sky-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-sky-400">
              Document Vault
            </h2>
          </div>

          <div className="relative bg-slate-800/50 rounded-lg p-6 border border-slate-700/40 flex items-center gap-4">
            {!isUnlocked ? (
              <>
                <div className="blur-md select-none pointer-events-none flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-slate-700" />
                  <div>
                    <p className="text-sm font-medium">Original_Quote.pdf</p>
                    <p className="text-xs text-slate-500">
                      Uploaded {new Date(analysis?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Lock className="h-6 w-6 text-slate-600 absolute right-6" />
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-sky-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Original_Quote.pdf
                  </p>
                  <p className="text-xs text-slate-500">
                    Uploaded{" "}
                    {new Date(analysis?.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-colors">
                  Download Original Quote
                </button>
              </>
            )}
          </div>
        </section>

        {/* ─── Provenance Footer ─────────────────────────────────── */}
        <footer className="text-center text-[11px] text-slate-600 font-mono py-6 space-y-1">
          <p>
            Scanned&nbsp;
            {new Date(analysis?.created_at).toLocaleString()} &middot;
            Rubric&nbsp;{analysis?.rubric_version ?? "—"} &middot;
            Confidence&nbsp;{analysis?.confidence_score ?? "—"}%
          </p>
          <p>WindowMan Intelligence — Contractor Eyes Only</p>
        </footer>
      </main>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function InfoRow({
  label,
  value,
  blur,
}: {
  label: string;
  value: string;
  blur?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-medium ${blur ? "blur-md select-none transition-all duration-500" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function PiiRow({
  label,
  value,
  blur,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  blur: boolean;
  onCopy?: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p
          className={`text-sm font-medium ${blur ? "blur-md select-none transition-all duration-500" : ""}`}
        >
          {value}
        </p>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-slate-500 hover:text-sky-400 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MarketIndicator({ price }: { price: number }) {
  const avg = 2100; // South Florida benchmark avg
  const diff = ((price - avg) / avg) * 100;
  const abs = Math.abs(Math.round(diff));

  if (abs < 5)
    return (
      <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-1">
        <Minus className="h-3 w-3" /> At market
      </span>
    );

  return diff > 0 ? (
    <span className="flex items-center justify-center gap-1 text-[10px] text-red-400 mt-1">
      <TrendingUp className="h-3 w-3" /> {abs}% above market
    </span>
  ) : (
    <span className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 mt-1">
      <TrendingDown className="h-3 w-3" /> {abs}% below market
    </span>
  );
}
