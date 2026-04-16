# Foreign Key Hardening Plan

## Relationships declared in types.ts

All relationships below are declared in `src/integrations/supabase/types.ts` Relationships arrays. Each was verified against migration files.

| Relationship | Migration Evidence | Enforcement |
|---|---|---|
| analyses → leads via lead_id | confirmed FK (`20260318033459`) | DB constraint |
| analyses → scan_sessions via scan_session_id | confirmed FK (`20260318033459`) | DB constraint |
| billable_intros → analyses via analysis_id | confirmed FK (`20260324043022`) | DB constraint |
| billable_intros → contractors via contractor_id | confirmed FK (`20260324043022`) | DB constraint |
| billable_intros → leads via lead_id | confirmed FK (`20260324043022`) | DB constraint |
| billable_intros → contractor_opportunities via opportunity_id | confirmed FK (`20260324043022`) | DB constraint |
| billable_intros → contractor_opportunity_routes via route_id | confirmed FK (`20260324043022`) | DB constraint |
| contractor_activity_log → contractor_leads via contractor_lead_id | confirmed FK (`20260415084900`) | DB constraint |
| contractor_credit_ledger → contractor_profiles via contractor_id | confirmed FK (`20260408184518`) | DB constraint |
| contractor_credit_purchases → contractor_profiles via contractor_id | confirmed FK (`20260408225322`) | DB constraint |
| contractor_credits → contractor_profiles via contractor_id | confirmed FK (`20260408180723`) | DB constraint |
| contractor_followups → contractor_leads via contractor_lead_id | confirmed FK (`20260415084900`) | DB constraint |
| contractor_opportunities → analyses via analysis_id | confirmed FK (`20260324033303`) | DB constraint |
| contractor_opportunities → leads via lead_id | confirmed FK (`20260324033303`) | DB constraint |
| contractor_opportunities → scan_sessions via scan_session_id | confirmed FK (`20260324033303`) | DB constraint |
| contractor_opportunities → contractors via suggested_contractor_id | confirmed FK (`20260324074050`) | DB constraint |
| contractor_opportunity_routes → contractors via contractor_id | confirmed FK (`20260324033303`) | DB constraint |
| contractor_opportunity_routes → contractor_opportunities via opportunity_id | confirmed FK (`20260324033303`) | DB constraint |
| contractor_outcomes → billable_intros via billable_intro_id | confirmed FK (`20260324043022`) | DB constraint |
| contractor_outcomes → contractors via contractor_id | confirmed FK (`20260324043022`) | DB constraint |
| contractor_outcomes → contractor_opportunities via opportunity_id | confirmed FK (`20260324043022`) | DB constraint |
| contractor_outcomes → contractor_opportunity_routes via route_id | confirmed FK (`20260324043022`) | DB constraint |
| contractor_unlocked_leads → contractor_profiles via contractor_id | confirmed FK (`20260408180723`) | DB constraint |
| contractor_unlocked_leads → leads via lead_id | confirmed FK (`20260408180723`) | DB constraint |
| conversion_events → leads via lead_id | confirmed FK (`20260322070000`) | DB constraint |
| event_logs → leads via lead_id | confirmed FK (`20260318033459`) | DB constraint |
| lead_events → leads via lead_id | confirmed FK (`20260318033459`) | DB constraint |
| meta_configurations → clients via client_id | confirmed FK (`20260416121600`) | DB constraint |
| phone_verifications → leads via lead_id | confirmed FK (inferred from types.ts `phone_verifications_lead_id_fkey`) | DB constraint |
| quote_analyses → leads via lead_id | confirmed FK (`20260317051701`) | DB constraint |
| quote_comparisons → leads via lead_id | confirmed FK (`20260324033303` or similar) | DB constraint |
| quote_files → leads via lead_id | confirmed FK (`20260317051701`) | DB constraint |
| scan_sessions → leads via lead_id | confirmed FK (`20260318033459`) | DB constraint |
| scan_sessions → quote_files via quote_file_id | confirmed FK (`20260318033459`) | DB constraint |
| voice_followups → leads via lead_id | confirmed FK (`20260327080000`) | DB constraint |

## Logical references NOT in types.ts (no FK constraint)

These columns reference other tables by application logic only. They do NOT appear in types.ts Relationships arrays.

| Table | Column | Logical Reference | Current Enforcement | Risk of Adding FK | Recommendation |
|---|---|---|---|---|---|
| leads | latest_analysis_id | analyses.id | scan-quote edge function sets atomically | INSERT ordering — analysis must exist before lead UPDATE | Deferred |
| leads | latest_scan_session_id | scan_sessions.id | scan-quote edge function sets atomically | Same INSERT ordering issue | Deferred |
| leads | latest_opportunity_id | contractor_opportunities.id | admin edge functions | Same pattern | Deferred |
| leads | contractor_id | contractors.id | routing logic in edge functions | Low risk but not critical | Deferred |
| leads | suggested_contractor_id | contractors.id | matching engine in edge functions | Low risk | Deferred |
| contractors | auth_user_id | auth.users.id | accept-invite edge function | Cannot FK to auth schema | Cannot add |
| contractor_invitations | contractor_id | contractors.id | admin edge function | Low risk, safe to add | **Safe to add in future migration** |
| contractor_invitations | created_by | auth.users.id | admin edge function | Cannot FK to auth schema | Cannot add |
| contractor_invitations | accepted_by | auth.users.id | accept-invite edge function | Cannot FK to auth schema | Cannot add |
| lead_events | scan_session_id | scan_sessions.id | edge function event logging | FK would slow event writes | Deferred |
| lead_events | analysis_id | analyses.id | edge function event logging | FK would slow event writes | Deferred |
| lead_events | opportunity_id | contractor_opportunities.id | edge function event logging | FK would slow event writes | Deferred |

## Next steps

1. `contractor_invitations.contractor_id → contractors.id` is the only safe FK to add. Deferred to a future migration pass.
2. `leads.latest_*` columns require INSERT ordering changes in edge functions before FKs can be added.
3. `auth.users` references cannot have FKs from public schema (Supabase-reserved).
4. Event logging tables (`lead_events`) should not have FKs that could cause cascade failures.
