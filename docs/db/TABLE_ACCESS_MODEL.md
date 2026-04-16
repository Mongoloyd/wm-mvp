# Table Access Model

Classification of every table's access pattern based on RLS policies, RPCs, and edge functions.

## Access classes

- **CLIENT_READABLE** — RLS policy allows direct anon or authenticated reads
- **RPC_ONLY** — accessible only via SECURITY DEFINER functions
- **SERVICE_ROLE_ONLY** — accessible only via service-role key in edge functions
- **ADMIN_ONLY** — restricted to internal operators via `is_internal_operator()` check

---

| Table | Access Class | Access Mechanism | Columns Excluded from Client |
|---|---|---|---|
| analyses | ADMIN_ONLY + RPC_ONLY | `analyses_select_internal` (admin SELECT), `get_analysis_preview` / `get_analysis_full` RPCs, `analyses_service_role_all` (edge functions) | `full_json`, `flags` excluded from preview RPC; gated by OTP in full RPC |
| billable_intros | ADMIN_ONLY | `billable_intros_select_internal` + full CRUD for internal operators | All columns admin-only |
| capi_signal_logs | ADMIN_ONLY | `capi_logs_select_internal`, `capi_logs_service_role_all` | All columns admin-only |
| clients | CLIENT_READABLE + ADMIN_ONLY | `clients_anon_select_active` (anon reads active only), full CRUD for internal operators | None excluded for active clients |
| contractor_activity_log | SERVICE_ROLE_ONLY | `service_role_full_access_contractor_activity_log` | All columns service-role only |
| contractor_credit_ledger | CLIENT_READABLE (own) | `ccl_select_own` (contractor reads own rows via `auth.uid() = contractor_id`) | No INSERT/UPDATE/DELETE for clients |
| contractor_credit_purchases | CLIENT_READABLE (own) + ADMIN_ONLY | `ccp_select_own`, `ccp_select_internal`, `ccp_service_role_all` | No write access for clients |
| contractor_credits | CLIENT_READABLE (own) | `contractor_credits_select_own` | No write access for clients |
| contractor_followups | SERVICE_ROLE_ONLY | `service_role_full_access_contractor_followups` | All columns service-role only |
| contractor_invitations | ADMIN_ONLY | `invitations_select_internal` + full CRUD for internal operators, `invitations_service_role_all` | All columns admin-only |
| contractor_leads | SERVICE_ROLE_ONLY | `service_role_full_access_contractor_leads` | All columns service-role only |
| contractor_opportunities | ADMIN_ONLY | `contractor_opportunities_select_internal` + full CRUD for internal operators, `contractor_opportunities_service_role_all` | All columns admin-only |
| contractor_opportunity_routes | ADMIN_ONLY | `contractor_opportunity_routes_select_internal` + full CRUD for internal operators | All columns admin-only |
| contractor_outcomes | ADMIN_ONLY | `contractor_outcomes_select_internal` + full CRUD for internal operators | All columns admin-only |
| contractor_profiles | CLIENT_READABLE (own) | `contractor_profiles_select_own` (`auth.uid() = id`) | No write access for clients |
| contractor_unlocked_leads | CLIENT_READABLE (own) | `contractor_unlocked_leads_select_own` (`auth.uid() = contractor_id`) | No write access for clients |
| contractors | ADMIN_ONLY | `contractors_select_internal` + full CRUD for internal operators | All columns admin-only |
| conversion_events | SERVICE_ROLE_ONLY | RESTRICTIVE deny policies block anon; no authenticated SELECT policy; service-role implicit | All columns blocked from clients |
| county_benchmarks | CLIENT_READABLE | `county_benchmarks_select_public` (anon + authenticated), `county_benchmarks_service_role_all` | None excluded |
| event_logs | CLIENT_READABLE (write-only) | `anon_insert_event_logs` (anon INSERT only); no SELECT policy for clients | All columns write-only for clients |
| lead_events | ADMIN_ONLY | `lead_events_select_internal`, `lead_events_service_role_all` | All columns admin-only |
| leads | CLIENT_READABLE (limited) | `authenticated_select_own_leads` (via scan_sessions JOIN), `leads_anon_insert_constrained` (anon INSERT with constraints) | OTP fields constrained on INSERT; no UPDATE/DELETE for clients |
| meta_configurations | ADMIN_ONLY | `meta_config_select_internal` + full CRUD for internal operators, `meta_config_service_role_all` | All columns admin-only |
| otp_failures | ADMIN_ONLY | `otp_failures_select_internal` + full CRUD for internal operators | All columns admin-only |
| phone_verifications | SERVICE_ROLE_ONLY | `phone_verifications_service_role_all` | All columns service-role only |
| quote_analyses | SERVICE_ROLE_ONLY | `quote_analyses_service_role_all` (legacy table) | All columns service-role only |
| quote_comparisons | ADMIN_ONLY | `quote_comparisons_select_internal`, `quote_comparisons_service_role_all` | All columns admin-only |
| quote_files | CLIENT_READABLE (write-only) | `quote_files_anon_insert_only`, `quote_files_authenticated_insert_only` | No SELECT for clients |
| scan_sessions | CLIENT_READABLE (own) | Via authenticated user policies (user_id match) | Varies by policy |
| voice_followups | SERVICE_ROLE_ONLY | Service-role access via edge functions | All columns service-role only |

## SECURITY DEFINER RPCs

| Function | Tables Accessed | Purpose |
|---|---|---|
| `get_analysis_preview` | analyses | Returns grade, flag counts, proof_of_read, preview_json — no full_json |
| `get_analysis_full` | phone_verifications, leads, scan_sessions, analyses | Returns full_json only after OTP verification confirmed |
| `get_scan_status` | scan_sessions | Returns scan session status |
| `get_lead_by_session` | leads | Returns lead ID by session_id |
| `get_lead_by_email` | leads | Returns lead by email |
| `get_lead_phone_by_scan_session` | leads, scan_sessions | Returns phone for a scan session |
| `get_county_by_scan_session` | leads, scan_sessions | Returns county for a scan session |
| `unlock_contractor_lead` | contractor_profiles, leads, contractor_credits, contractor_unlocked_leads, contractor_credit_ledger | Atomic credit debit + lead unlock |
| `admin_adjust_contractor_credits` | contractor_profiles, contractor_credits, contractor_credit_ledger | Admin credit adjustment |
| `fulfill_contractor_credit_purchase` | contractor_credit_purchases, contractor_credits, contractor_credit_ledger | Stripe purchase fulfillment |
| `get_rubric_stats` | analyses | Admin-only rubric statistics |
| `is_internal_operator` | (JWT check) | Returns true if user has operator/admin/super_admin role |
| `has_role` / `has_any_role` | user_roles | Role checking utilities |
