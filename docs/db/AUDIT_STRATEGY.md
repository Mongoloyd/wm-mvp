# Row-History & Audit Strategy

## Current State

The platform has partial audit coverage through dedicated logging tables and triggers:

### Existing audit infrastructure

| Mechanism | Scope | Type |
|-----------|-------|------|
| `lead_events` table | Lead lifecycle events (OTP, scan, handoff, voice calls) | Application-level event log |
| `event_logs` table | Frontend analytics events (page_view, upload, CTA clicks) | Client-side event log |
| `contractor_activity_log` table | Pipeline stage changes for contractor leads | Trigger-driven audit |
| `contractor_credit_ledger` table | Every credit mutation (debit, seed, refund, purchase) | Append-only ledger |
| `user_role_audit_log` table | Role changes (who changed what role, when) | Application-level audit |
| `capi_signal_logs` table | Meta CAPI signal deliveries | Edge function audit |
| `log_phone_verification_event()` trigger | OTP creation, verification, expiry | DB trigger → RAISE LOG |
| `log_contractor_pipeline_change()` trigger | Contractor lead stage transitions | DB trigger → activity_log INSERT |
| `fire_crm_handoff()` trigger | Lead qualification events | DB trigger → webhook_deliveries + lead_events |

### What is NOT currently audited

| Table | Missing audit type | Risk |
|-------|-------------------|------|
| `analyses` | No mutation history — updates overwrite in place | Medium — rubric version changes or re-scans lose previous state |
| `contractor_opportunities` | No status change history | Medium — status transitions (intro_requested → routed → released) are not historized |
| `billable_intros` | No billing_status change history | High — financial state transitions (pending → paid → disputed → refunded) should be auditable |
| `contractor_opportunity_routes` | No route_status / release_status change history | Medium — routing decisions lack audit trail |
| `leads` | Partial — `lead_events` captures named events but not field-level diffs | Low — most important transitions are already logged via lead_events |

## Recommended Strategy

### Tier 1: Financial audit (implement first)

**`billable_intros` status changes** — Critical for dispute resolution and revenue reconciliation.

```sql
-- Example trigger (deferred — implement when billing goes live)
CREATE TABLE public.billable_intro_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billable_intro_id uuid NOT NULL REFERENCES billable_intros(id),
  old_status text,
  new_status text,
  changed_by text,  -- edge function or user ID
  changed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

CREATE OR REPLACE FUNCTION log_billable_intro_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.billing_status IS DISTINCT FROM OLD.billing_status THEN
    INSERT INTO billable_intro_audit (billable_intro_id, old_status, new_status, changed_by, metadata)
    VALUES (NEW.id, OLD.billing_status, NEW.billing_status, current_setting('request.jwt.claims', true)::jsonb->>'sub', 
            jsonb_build_object('fee_amount', NEW.fee_amount, 'billing_model', NEW.billing_model));
  END IF;
  RETURN NEW;
END; $$;
```

### Tier 2: Routing audit (implement with Reclamation Engine)

**`contractor_opportunities` and `contractor_opportunity_routes` status changes** — Needed for the Reclamation Engine (Phase 3, Prompt 11) to track lead reassignment history.

Implementation: Add a `routing_audit` table with trigger on status/route_status changes.

### Tier 3: Analysis versioning (implement with rubric upgrades)

**`analyses` rubric version changes** — When re-scanning with a new rubric version, preserve the previous analysis as a snapshot rather than overwriting.

Implementation: Add an `analysis_snapshots` table populated by a BEFORE UPDATE trigger when `rubric_version` changes.

## Implementation timeline

| Tier | When to implement | Blocked by |
|------|-------------------|------------|
| Tier 1 (billable_intros) | Before billing goes to production | Stripe auto-deactivation (Prompt 9) |
| Tier 2 (routing) | With Reclamation Engine | Prompt 11 |
| Tier 3 (analysis versioning) | With next rubric major version bump | Rubric v2.0 |

## Current decision

All three tiers are **documented but deferred** — they require coordinated implementation with their dependent features. Adding audit triggers prematurely would add write overhead to tables that are still evolving structurally.
