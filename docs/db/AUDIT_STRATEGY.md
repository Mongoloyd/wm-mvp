# Row-History & Audit Strategy

## Current state of durable mutation history

### analyses

TABLE: analyses
EXISTING TRACKING: none
EVIDENCE: No trigger or audit table found in any migration file. Writes go through `scan-quote` edge function (service-role) which overwrites in place.

### contractor_opportunities

TABLE: contractor_opportunities
EXISTING TRACKING: none
EVIDENCE: No trigger or audit table found in any migration file. Status changes via `admin-data` edge function and `contractor-actions` edge function.

### billable_intros

TABLE: billable_intros
EXISTING TRACKING: none
EVIDENCE: No trigger or audit table found in any migration file. Financial state transitions (`billing_status`) are not historized.

### contractor_opportunity_routes

TABLE: contractor_opportunity_routes
EXISTING TRACKING: none
EVIDENCE: No trigger or audit table found in any migration file. Route status and release status changes are not historized.

## Existing audit infrastructure in the repo

| Mechanism | Scope | Migration |
|---|---|---|
| `contractor_activity_log` table + `log_contractor_pipeline_change()` trigger | `contractor_leads.pipeline_stage` transitions | `20260415084900_contractor_crm_schema.sql` |
| `contractor_credit_ledger` table | Every credit mutation (debit, seed, refund, purchase) | `20260408184518` |
| `lead_events` table | Lead lifecycle events (OTP, scan, handoff, voice calls) | `20260318033459` |
| `event_logs` table | Frontend analytics events | `20260318033459` |
| `user_role_audit_log` table | Role changes | `20260408180723` |
| `capi_signal_logs` table | Meta CAPI signal deliveries | `20260416121600` |
| `log_phone_verification_event()` trigger | OTP creation, verification, expiry | `20260318033459` |
| `fire_crm_handoff()` trigger | Lead qualification events | `20260324033303` |

## Why no migration was produced

The only existing trigger-based audit pattern is `log_contractor_pipeline_change()` which writes to `contractor_activity_log` using the `contractor_activity_type` enum. This pattern is specific to `contractor_leads` and cannot be mirrored for the four tables above without:

1. Creating new enum types for each table's status transitions
2. Creating new audit tables with different column structures
3. Creating new trigger functions with different logic

This would be new trigger infrastructure with no identical precedent in the codebase.

## Deferred implementation plan

### Tier 1: Financial audit (implement before billing goes to production)

**`billable_intros` status changes** — Critical for dispute resolution and revenue reconciliation.

```sql
CREATE TABLE public.billable_intro_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billable_intro_id uuid NOT NULL REFERENCES billable_intros(id),
  old_status text,
  new_status text,
  changed_by text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

CREATE OR REPLACE FUNCTION log_billable_intro_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.billing_status IS DISTINCT FROM OLD.billing_status THEN
    INSERT INTO billable_intro_audit (billable_intro_id, old_status, new_status, changed_by, metadata)
    VALUES (NEW.id, OLD.billing_status, NEW.billing_status,
            current_setting('request.jwt.claims', true)::jsonb->>'sub',
            jsonb_build_object('fee_amount', NEW.fee_amount, 'billing_model', NEW.billing_model));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_billable_intro_audit
  AFTER UPDATE ON public.billable_intros
  FOR EACH ROW EXECUTE FUNCTION log_billable_intro_change();
```

**Dependency:** Stripe auto-charge billing flow must be live first.

### Tier 2: Routing audit (implement with Reclamation Engine)

**`contractor_opportunities` and `contractor_opportunity_routes` status changes.**

Implementation: Add a `routing_audit` table with trigger on `status`/`route_status`/`release_status` changes.

**Dependency:** Reclamation Engine feature (reassignment history needed).

### Tier 3: Analysis versioning (implement with rubric upgrades)

**`analyses` rubric version changes** — When re-scanning with a new rubric version, preserve the previous analysis as a snapshot.

Implementation: Add an `analysis_snapshots` table populated by a BEFORE UPDATE trigger when `rubric_version` changes.

**Dependency:** Rubric v2.0 major version bump.

## Implementation timeline

| Tier | When to implement | Blocked by |
|---|---|---|
| Tier 1 (billable_intros) | Before billing goes to production | Stripe auto-deactivation |
| Tier 2 (routing) | With Reclamation Engine | Reclamation Engine feature |
| Tier 3 (analysis versioning) | With next rubric major version bump | Rubric v2.0 |
