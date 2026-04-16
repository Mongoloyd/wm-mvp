# Table Access Model — Current Reality

Last verified: 2026-04-16

This document classifies every table by its actual access pattern. Use this to understand what code paths reach each table and why certain RLS policies exist (or intentionally don't).

## Access Pattern Legend

- **Anon client**: Anonymous frontend user (scan funnel, upload, event logging)
- **Auth client**: Authenticated frontend user (contractor portal, admin dashboard)
- **RPC**: SECURITY DEFINER function (called by any role, executes as function owner)
- **Service-role**: Edge functions using `SUPABASE_SERVICE_ROLE_KEY`
- **Internal operator**: Authenticated user with `is_internal_operator()` = true (admin dashboard)

---

## Consumer-Facing Tables

| Table | Read | Write | Access Model | Notes |
|-------|------|-------|-------------|-------|
| `leads` | RPC (`get_lead_by_session`, `get_lead_by_email`) | Anon INSERT (constrained), service-role UPDATE | Anon creates, service-role manages | Anon INSERT prevents OTP forgery |
| `scan_sessions` | RPC (`get_scan_status`) | Anon INSERT (user_id must be NULL) | Anon creates, service-role manages | No SELECT policy — status checked via RPC |
| `quote_files` | None (no SELECT policy) | Anon/auth INSERT (lead_id + storage_path required) | Write-only from client | Status tracked via scan_sessions |
| `analyses` | RPC (`get_analysis_preview`, `get_analysis_full`) | Service-role only | RPC-gated, never direct client read | `get_analysis_full` validates phone verification |
| `phone_verifications` | RPC (`get_analysis_full` checks internally) | Service-role only | Fully service-role | Used by OTP edge functions |
| `event_logs` | None (no SELECT policy) | Anon INSERT (unrestricted) | Write-only analytics sink | No PII, intentionally permissive |
| `county_benchmarks` | Anon/auth SELECT | Service-role only | Public read, admin write | Frontend currently uses hardcoded data |

## Contractor Portal Tables

| Table | Read | Write | Access Model |
|-------|------|-------|-------------|
| `contractor_profiles` | Auth SELECT (own row only) | Service-role only | Owner-scoped read |
| `contractor_credits` | Auth SELECT (own row only) | Service-role (via atomic RPCs) | Owner-scoped read |
| `contractor_credit_ledger` | Auth SELECT (own row only) | Service-role (via atomic RPCs) | Owner-scoped read |
| `contractor_credit_purchases` | Auth SELECT (own or internal) | Service-role only | Owner + admin read |
| `contractor_unlocked_leads` | Auth SELECT (own row only) | Service-role (via `unlock_contractor_lead` RPC) | Owner-scoped read |

## Admin/Operator Tables

| Table | Read | Write | Access Model |
|-------|------|-------|-------------|
| `contractor_opportunities` | Internal operator SELECT | Internal operator CRUD, service-role ALL | Admin-only |
| `contractor_opportunity_routes` | Internal operator SELECT | Internal operator CRUD | Admin-only |
| `billable_intros` | Internal operator SELECT | Internal operator CRUD | Admin-only |
| `contractor_outcomes` | Internal operator SELECT | Internal operator CRUD | Admin-only |
| `contractors` | Internal operator SELECT | Internal operator CRUD | Admin-only |
| `contractor_invitations` | Internal operator SELECT | Internal operator CRUD, service-role ALL | Admin-only |
| `lead_events` | Internal operator SELECT | Service-role only (triggers + edge functions) | Admin read, service-role write |
| `otp_failures` | Internal operator CRUD | Internal operator CRUD | Admin-only |
| `user_roles` | Has_role RPC | Service-role only | RPC-gated |
| `user_role_audit_log` | Super-admin SELECT | Service-role only (RESTRICTIVE deny on public INSERT) | Super-admin read |
| `clients` | Anon SELECT (active only), internal operator CRUD | Internal operator CRUD, service-role ALL | Public read for slug validation |
| `meta_configurations` | Internal operator SELECT | Internal operator CRUD, service-role ALL | Admin-only |
| `capi_signal_logs` | Internal operator SELECT | Service-role ALL | Admin read, service-role write |

## B2B Pipeline Tables

| Table | Read | Write | Access Model |
|-------|------|-------|-------------|
| `contractor_leads` | Service-role only | Service-role only | Fully service-role |
| `contractor_activity_log` | Service-role only | Service-role only (trigger) | Fully service-role |
| `contractor_followups` | Service-role only | Service-role only | Fully service-role |

## Legacy/Unused Tables

| Table | Status | Notes |
|-------|--------|-------|
| `quote_analyses` | Legacy | Early prototype table. Service-role only policy. Not used by current product. |
| `quote_comparisons` | Service-role + internal operator | Used by `compare-quotes` edge function. |
| `service_tickets` | Legacy | Not part of core product. Service-role only policy. |
| `conversion_events` | Restricted | CAPI tracking. RESTRICTIVE deny on anon. No auth policies besides deny. |

---

## Edge Functions — Current Inventory

Active edge functions (from `supabase/config.toml` + filesystem):

| Function | JWT Required | Purpose |
|----------|-------------|---------|
| `send-otp` | No | Twilio OTP send |
| `verify-otp` | No | Twilio OTP verify |
| `generate-contractor-brief` | No | AI brief generation |
| `contractor-actions` | No | Contractor portal actions |
| `voice-followup` | No | Voice call webhook handler |
| `admin-data` | No | Admin dashboard data (validates internally via adminAuth) |
| `dial-lead` | No | Trigger voice call to lead |
| `send-contractor-handoff` | No | CRM handoff notification |
| `dispatch-platform-events` | No | Meta/Google CAPI dispatch |
| `scan-quote` | Yes (default) | AI quote analysis |
| `create-checkout-session` | Yes | Stripe checkout |
| `stripe-webhook` | Yes | Stripe webhook handler |
| `accept-invite` | Yes | Contractor invite acceptance |
| `enrich-lead` | Yes | Lead enrichment |
| `qualify-homepage-lead` | Yes | Homepage lead qualification |
| `request-callback` | Yes | Homeowner callback request |
| `unlock-lead` | Yes | Contractor lead unlock |
| `compare-quotes` | Yes | Multi-quote comparison |
| `dev-report-unlock` | Yes | Dev-only report bypass |
| `get-contractor-document-url` | Yes | Signed URL for quote files |
| `get-contractor-dossier` | Yes | Contractor intelligence |
| `list-contractor-opportunities` | Yes | Contractor opportunity list |
| `save-routing-preferences` | Yes | Contractor routing prefs |
| `send-report-email` | Yes | Report delivery email |
| `lead-reactivation` | Yes | Ghost lead recovery |
| `refresh-benchmarks` | Yes | County benchmark refresh |
| `calculate-estimate-metrics` | Yes | Estimate calculations |
| `capi-event` | Yes | CAPI signal fire |
| `generate-negotiation-script` | Yes | AI negotiation script |
| `process-webhook` | Yes | Generic webhook processor |
| `contractor-booking-confirmed` | Yes | Booking confirmation handler |
| `contractor-mark-no-show` | Yes | No-show marking |
| `contractor-send-followups` | Yes | Followup automation |

**Note:** Functions with `verify_jwt = false` in config.toml handle their own authentication internally (e.g., `admin-data` uses `adminAuth.ts` with bearer token + role validation).
