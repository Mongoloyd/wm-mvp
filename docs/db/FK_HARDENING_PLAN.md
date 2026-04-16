# Foreign Key Hardening Plan

## Current State

The generated `types.ts` declares `Relationships` arrays that reflect actual FK constraints in the database. However, many logical relationships between tables are enforced only by application logic (edge functions, SECURITY DEFINER RPCs), not by formal FK constraints.

## Audit: Where referential integrity is enforced

### Enforced by actual DB constraints (FK)

These tables have real FK constraints (verified in types.ts `Relationships` arrays):

| Table | FK Column | References | Enforced |
|-------|-----------|------------|----------|
| `analyses` | `lead_id` | `leads.id` | ✅ FK |
| `analyses` | `scan_session_id` | `scan_sessions.id` | ✅ FK |
| `billable_intros` | `analysis_id` | `analyses.id` | ✅ FK |
| `billable_intros` | `contractor_id` | `contractors.id` | ✅ FK |
| `billable_intros` | `lead_id` | `leads.id` | ✅ FK |
| `billable_intros` | `opportunity_id` | `contractor_opportunities.id` | ✅ FK |
| `billable_intros` | `route_id` | `contractor_opportunity_routes.id` | ✅ FK |
| `contractor_activity_log` | `contractor_lead_id` | `contractor_leads.id` | ✅ FK |
| `contractor_credit_ledger` | `contractor_id` | `contractor_profiles.id` | ✅ FK |
| `contractor_credit_purchases` | `contractor_id` | `contractor_profiles.id` | ✅ FK |
| `contractor_credits` | `contractor_id` | `contractor_profiles.id` | ✅ FK |
| `contractor_followups` | `contractor_lead_id` | `contractor_leads.id` | ✅ FK |
| `contractor_opportunities` | `analysis_id` | `analyses.id` | ✅ FK |
| `contractor_opportunities` | `lead_id` | `leads.id` | ✅ FK |
| `contractor_opportunities` | `scan_session_id` | `scan_sessions.id` | ✅ FK |
| `contractor_opportunities` | `suggested_contractor_id` | `contractors.id` | ✅ FK |
| `contractor_opportunity_routes` | `contractor_id` | `contractors.id` | ✅ FK |
| `contractor_opportunity_routes` | `opportunity_id` | `contractor_opportunities.id` | ✅ FK |
| `contractor_outcomes` | `billable_intro_id` | `billable_intros.id` | ✅ FK |
| `contractor_outcomes` | `contractor_id` | `contractors.id` | ✅ FK |
| `contractor_outcomes` | `opportunity_id` | `contractor_opportunities.id` | ✅ FK |
| `contractor_outcomes` | `route_id` | `contractor_opportunity_routes.id` | ✅ FK |
| `contractor_unlocked_leads` | `contractor_id` | `contractor_profiles.id` | ✅ FK |
| `contractor_unlocked_leads` | `lead_id` | `leads.id` | ✅ FK |
| `conversion_events` | `lead_id` | `leads.id` | ✅ FK |
| `event_logs` | `lead_id` | `leads.id` | ✅ FK |
| `lead_events` | `lead_id` | `leads.id` | ✅ FK |
| `quote_analyses` | `lead_id` | `leads.id` | ✅ FK |
| `quote_comparisons` | `lead_id` | `leads.id` | ✅ FK |

### Enforced by application logic only (no FK)

These columns reference other tables but lack formal constraints:

| Table | Column | Logical Reference | Risk | Recommendation |
|-------|--------|-------------------|------|----------------|
| `leads` | `latest_analysis_id` | `analyses.id` | Low — set by `scan-quote` edge function atomically | Deferred — adding FK could cause INSERT ordering issues |
| `leads` | `latest_scan_session_id` | `scan_sessions.id` | Low — set by same edge function | Deferred — same reason |
| `leads` | `latest_opportunity_id` | `contractor_opportunities.id` | Low — set by admin edge functions | Deferred |
| `leads` | `contractor_id` | `contractors.id` | Low — set by routing logic | Deferred |
| `leads` | `suggested_contractor_id` | `contractors.id` | Low — set by matching engine | Deferred |
| `contractors` | `auth_user_id` | `auth.users.id` | Medium — not a public schema reference | Cannot FK to auth.users (reserved schema) |
| `contractor_invitations` | `contractor_id` | `contractors.id` | Low — set by admin | **Safe to add** |
| `contractor_invitations` | `created_by` | `auth.users.id` | N/A — reserved schema | Cannot FK |
| `contractor_invitations` | `accepted_by` | `auth.users.id` | N/A — reserved schema | Cannot FK |
| `lead_events` | `scan_session_id` | `scan_sessions.id` | Low — event logging | Deferred — would slow event writes |
| `lead_events` | `analysis_id` | `analyses.id` | Low — event logging | Deferred |
| `lead_events` | `opportunity_id` | `contractor_opportunities.id` | Low — event logging | Deferred |

### Enforced by SECURITY DEFINER functions

| Function | Tables accessed | Integrity guaranteed by |
|----------|----------------|------------------------|
| `get_analysis_full` | `phone_verifications`, `leads`, `scan_sessions`, `analyses` | JOIN logic validates relationships |
| `get_analysis_preview` | `analyses` | WHERE clause on `scan_session_id` |
| `unlock_contractor_lead` | `contractor_profiles`, `leads`, `contractor_credits`, `contractor_unlocked_leads`, `contractor_credit_ledger` | Sequential validation + FOR UPDATE locks |
| `admin_adjust_contractor_credits` | `contractor_profiles`, `contractor_credits`, `contractor_credit_ledger` | Sequential validation |
| `fulfill_contractor_credit_purchase` | `contractor_credit_purchases`, `contractor_credits`, `contractor_credit_ledger` | Idempotent check + FOR UPDATE lock |

## Decision: What to add now vs defer

### Safe to add now
- `contractor_invitations.contractor_id → contractors.id` — clear parent-child, no ordering risk

### Deferred (with rationale)
- `leads.latest_*` columns: These are denormalized pointers updated after the referenced row exists. Adding FKs would require INSERT ordering changes in edge functions.
- `lead_events` reference columns: Event logging tables should not have FKs that could cause cascade failures or slow down writes.
- `auth.users` references: Cannot add FKs to Supabase-reserved schemas.

## Next steps
1. Add the safe FK (`contractor_invitations.contractor_id`) in a future migration
2. Monitor orphan rates for deferred columns via periodic admin queries
3. Re-evaluate `leads.latest_*` FKs after the service layer refactor (Phase 2)
