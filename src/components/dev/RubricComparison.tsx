/**
 * Dev-only: Rubric version comparison dashboard.
 * Shows grade distribution per rubric_version with stacked bars and deltas.
 */

import { useRubricStats, type RubricStatRow } from "@/hooks/useRubricStats";
import { RefreshCw } from "lucide-react";

if (!import.meta.env.DEV) {
  // Tree-shaken in production
}

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

const GRADES = ["A", "B", "C", "D", "F"] as const;

function gradeCount(row: RubricStatRow, g: string): number {
  const key = `grade_${g.toLowerCase()}` as keyof RubricStatRow;
  return (row[key] as number) || 0;
}

function pct(count: number, total: number): string {
  if (total === 0) return "0";
  return ((count / total) * 100).toFixed(1);
}

function GradeBar({ row }: { row: RubricStatRow }) {
  const total = GRADES.reduce((s, g) => s + gradeCount(row, g), 0);
  if (total === 0) return <div style={{ color: "#666", fontSize: 11 }}>No graded scans</div>;

  return (
    <div style={{ display: "flex", height: 20, borderRadius: 4, overflow: "hidden", width: "100%" }}>
      {GRADES.map((g) => {
        const count = gradeCount(row, g);
        if (count === 0) return null;
        const width = `${(count / total) * 100}%`;
        return (
          <div
            key={g}
            title={`${g}: ${count} (${pct(count, total)}%)`}
            style={{
              width,
              background: GRADE_COLORS[g],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#000",
              minWidth: count > 0 ? 18 : 0,
            }}
          >
            {g}
          </div>
        );
      })}
    </div>
  );
}

function DeltaRow({ prev, curr }: { prev: RubricStatRow; curr: RubricStatRow }) {
  const prevTotal = GRADES.reduce((s, g) => s + gradeCount(prev, g), 0);
  const currTotal = GRADES.reduce((s, g) => s + gradeCount(curr, g), 0);
  if (prevTotal === 0 || currTotal === 0) return null;

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "#999", marginTop: 4 }}>
      {GRADES.map((g) => {
        const prevPct = (gradeCount(prev, g) / prevTotal) * 100;
        const currPct = (gradeCount(curr, g) / currTotal) * 100;
        const delta = currPct - prevPct;
        if (Math.abs(delta) < 0.5) return null;
        const sign = delta > 0 ? "+" : "";
        const color = g === "A" || g === "B" ? (delta > 0 ? "#22c55e" : "#ef4444") : delta > 0 ? "#ef4444" : "#22c55e";
        return (
          <span key={g} style={{ color }}>
            {g}: {sign}{delta.toFixed(1)}%
          </span>
        );
      })}
      <span style={{ color: "#666" }}>
        ({prev.rubric_version} → {curr.rubric_version})
      </span>
    </div>
  );
}

export function RubricComparison() {
  const { rows, loading, error, refetch } = useRubricStats();

  if (!import.meta.env.DEV) return null;

  return (
    <div style={{ padding: 16, border: "1px dashed #555", background: "#0a0a0a", maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ color: "#e5e5e5", margin: 0, fontSize: 14, fontWeight: 600 }}>
          📊 Rubric Version Comparison
        </h3>
        <button
          onClick={refetch}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", background: "#1a1a1a", color: "#999",
            border: "1px solid #333", borderRadius: 4, cursor: "pointer", fontSize: 12,
          }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: 12 }}>Error: {error}</p>}

      {!loading && rows.length === 0 && (
        <p style={{ color: "#666", fontSize: 12 }}>No analysis data yet. Run some scenarios first.</p>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333", color: "#999" }}>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>Version</th>
                <th style={{ textAlign: "center", padding: "6px 8px" }}>Total</th>
                {GRADES.map((g) => (
                  <th key={g} style={{ textAlign: "center", padding: "6px 8px", color: GRADE_COLORS[g] }}>{g}</th>
                ))}
                <th style={{ textAlign: "center", padding: "6px 8px" }}>Avg Conf</th>
                <th style={{ textAlign: "center", padding: "6px 8px" }}>Invalid</th>
                <th style={{ textAlign: "left", padding: "6px 8px", minWidth: 160 }}>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = GRADES.reduce((s, g) => s + gradeCount(row, g), 0);
                return (
                  <tr key={row.rubric_version || "null"} style={{ borderBottom: "1px solid #222", color: "#e5e5e5" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>
                      {row.rubric_version || "—"}
                    </td>
                    <td style={{ textAlign: "center", padding: "6px 8px" }}>{row.total_count}</td>
                    {GRADES.map((g) => {
                      const count = gradeCount(row, g);
                      return (
                        <td key={g} style={{ textAlign: "center", padding: "6px 8px" }}>
                          {count > 0 ? (
                            <span>
                              {count}{" "}
                              <span style={{ color: "#666", fontSize: 10 }}>({pct(count, total)}%)</span>
                            </span>
                          ) : (
                            <span style={{ color: "#333" }}>0</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "center", padding: "6px 8px" }}>
                      {row.avg_confidence != null ? row.avg_confidence : "—"}
                    </td>
                    <td style={{ textAlign: "center", padding: "6px 8px" }}>{row.invalid_count}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <GradeBar row={row} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Delta between consecutive versions */}
          {rows.length >= 2 && (
            <div style={{ marginTop: 12, padding: "8px 8px 0" }}>
              <p style={{ color: "#999", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>VERSION DELTA</p>
              {rows.slice(1).map((curr, i) => (
                <DeltaRow key={curr.rubric_version} prev={rows[i]} curr={curr} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
