/**
 * matchReasons.ts — Shared taxonomy for suggested match reason keys.
 * All persisted suggested_match_reasons keys must come from this file.
 */

export type MatchReasonKey =
  | 'county_specialist'
  | 'project_type_fit'
  | 'window_count_fit'
  | 'vetted_contractor'
  | 'strong_local_coverage'
  | 'suitable_for_scope_complexity'
  | 'accepts_low_grade_leads'
  | 'recommended_by_operator_rules'
  | 'primary_market_partner'
  | 'regional_service_coverage'
  | 'target_vulnerability_specialist';

/** Homeowner-friendly labels */
export const MATCH_REASON_HOMEOWNER: Record<MatchReasonKey, string> = {
  county_specialist: 'Specializes in your county',
  project_type_fit: 'Strong fit for your project type',
  window_count_fit: 'Handles projects of your size',
  vetted_contractor: 'WindowMan vetted and verified',
  strong_local_coverage: 'Active in your service area',
  suitable_for_scope_complexity: 'Vetted for the type of issues flagged in your quote',
  accepts_low_grade_leads: 'Experienced with quotes that need significant improvement',
  recommended_by_operator_rules: 'Recommended by WindowMan operations',
  primary_market_partner: "WindowMan's preferred market partner",
  regional_service_coverage: 'Serves your region',
  target_vulnerability_specialist: 'Specializes in quotes that need significant improvement',
};

/** Admin labels */
export const MATCH_REASON_ADMIN: Record<MatchReasonKey, string> = {
  county_specialist: 'County match',
  project_type_fit: 'Project type match',
  window_count_fit: 'Window count fit',
  vetted_contractor: 'Vetted',
  strong_local_coverage: 'Local coverage',
  suitable_for_scope_complexity: 'Scope complexity fit',
  accepts_low_grade_leads: 'Low-grade lead OK',
  recommended_by_operator_rules: 'Operator rule',
  primary_market_partner: 'Primary partner',
  regional_service_coverage: 'Regional coverage',
  target_vulnerability_specialist: 'High-opportunity lead',
};

/** Call intent types */
export type CallIntent = 'contractor_intro' | 'report_explainer';

/** CTA source types */
export type CtaSource = 'intro_request' | 'report_help' | 'comparison_request';

/** Match confidence levels */
export type MatchConfidence = 'high' | 'medium' | 'low';

/** Webhook status values */
export type WebhookStatus = 'queued' | 'sent' | 'failed';
