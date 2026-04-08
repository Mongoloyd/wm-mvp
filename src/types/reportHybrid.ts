// ── Shared item shapes for warnings / missing items ──────────────────────────

export interface WarningItem {
  id?: string;
  headline?: string;
  detail?: string;
  pillar?: string;
  severity?: string;
}

export type WarningEntry = string | WarningItem;

export interface MissingItem {
  id?: string;
  label?: string;
  why_it_matters?: string;
}

export type MissingItemEntry = string | MissingItem;

// ── Hybrid payloads ──────────────────────────────────────────────────────────

export interface HybridPreviewPayload {
  top_warning?: string | null;
  top_missing_item?: string | null;
  missing_items_count?: number;
  payment_risk_detected?: boolean;
  scope_gap_detected?: boolean;
  price_per_opening_band?: "low" | "market" | "high" | "extreme" | null;
  summary_teaser?: string | null;
}

export interface HybridFullPayload {
  warnings?: WarningEntry[];
  missing_items?: MissingItemEntry[];
  summary?: string | null;
  top_warning?: string | null;
  top_missing_item?: string | null;
  price_per_opening?: number | null;
  price_per_opening_band?: "low" | "market" | "high" | "extreme" | null;
  payment_risk_detected?: boolean;
  scope_gap_detected?: boolean;
}
