

## Plan: Create Contractors2 CRM Migration

### What
Run the user-provided SQL migration to create the contractor CRM schema: `contractor_leads`, `contractor_activity_log`, `contractor_followups` tables with enums, indexes, triggers, and RLS policies.

### Steps

1. **Create the migration file** at `supabase/migrations/20260414_contractors2_crm.sql` with the exact SQL provided by the user — no modifications needed.

2. **Run the migration** via the database migration tool so the tables, enums, indexes, triggers, and policies are applied to the Supabase project.

### What gets created
- 6 custom enums (`contractor_qualification_status`, `contractor_booking_status`, `contractor_pipeline_stage`, `contractor_activity_type`, `contractor_followup_type`, `contractor_followup_status`)
- 3 tables (`contractor_leads`, `contractor_activity_log`, `contractor_followups`)
- 11 indexes for query performance
- 2 triggers (`set_contractor_updated_at`, `log_contractor_pipeline_change`)
- 3 RLS policies (service_role full access on each table)
- RLS enabled on all 3 tables

### Notes
- No frontend code changes needed for this step
- The `anon` role has no policies, so these tables are backend-only (accessed via service_role in edge functions) — correct for a CRM

