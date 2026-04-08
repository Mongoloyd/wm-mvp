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
  warnings?: string[];
  missing_items?: string[];
  summary?: string | null;
  top_warning?: string | null;
  top_missing_item?: string | null;
  price_per_opening?: number | null;
  price_per_opening_band?: "low" | "market" | "high" | "extreme" | null;
  payment_risk_detected?: boolean;
  scope_gap_detected?: boolean;
}
