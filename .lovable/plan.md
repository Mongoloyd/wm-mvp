

## Prompt Rating

**Clarity: 78/100.** The intent is crystal clear — enable pg_cron, schedule process-webhook, add idempotency. The placeholder notation `[YOUR_PROJECT_ID]` and `[YOUR_SERVICE_ROLE_KEY]` is good directionally but slightly ambiguous (should those be hardcoded SQL strings, or should we use Supabase vault secrets?). The "verify the trigger" step is vague — it's unclear what "confirm the logic is active" means in concrete terms. Overall, a strong directional prompt.

**Comprehensiveness: 62/100.** It covers the happy path well but misses several operational details:
- The `cron.schedule` SQL cannot be run via a migration file (it contains project-specific secrets that shouldn't be committed to git) — it needs to be run via the Supabase insert/SQL tool instead.
- No mention of using `current_setting('app.settings.service_role_key')` or the Supabase vault for the service role key — hardcoding it in a cron job is a security concern.
- The idempotency constraint needs specifics: should it be a unique index on `(lead_id, event_type)` with a `WHERE status != 'dead_letter'` filter, or a simple unique pair?
- Missing: what happens if the cron job fires while a previous invocation is still running (overlapping executions)?
- Missing: the `pg_net` extension may already exist or may need specific permissions.
- The existing `process-webhook` function already has retry logic, exponential backoff, and failure logging (the prompt says it "likely lacks" these — it doesn't). This would have sent the AI down a wrong path for Prompt 2.

---

## Phase 2, Step 1 — Webhook Scheduler Plan

### What We're Building
A pg_cron heartbeat that invokes `process-webhook` every 60 seconds, plus a uniqueness constraint to prevent duplicate webhook deliveries for the same lead/event.

### Step 1: Enable Extensions (Migration)
Create a migration to enable `pg_cron` and `pg_net`:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```
Note: `pg_cron` must live in `pg_catalog` on Supabase. This is a structural change, so it uses the migration tool.

### Step 2: Schedule the Cron Job (Insert Tool — NOT Migration)
Use the **insert tool** (not a migration) to create the scheduled job, since it contains project-specific secrets that must not be committed to version control:
```sql
SELECT cron.schedule(
  'process-webhooks-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wkrcyxcnzhwjtdpmfpaf.supabase.co/functions/v1/process-webhook',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```
We use the **anon key** here (not service role) because the `process-webhook` function already creates its own service-role client internally. The anon key is sufficient to invoke it, and it's safer to expose in a cron definition.

### Step 3: Add Idempotency Constraint (Migration)
Add a unique partial index on `webhook_deliveries` to prevent the `fire_crm_handoff` trigger from queueing duplicate deliveries for the same lead:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_deliveries_lead_event_unique
ON public.webhook_deliveries (lead_id, event_type)
WHERE status NOT IN ('delivered', 'mock_delivered', 'dead_letter');
```
This allows re-queuing after a successful delivery or dead-letter (e.g., if a lead re-qualifies), but prevents duplicate pending/failed rows for the same lead+event.

### Step 4: Verify
- Query `cron.job` to confirm the scheduled job exists and is active.
- Query `webhook_deliveries` to confirm the trigger is wired (check for any existing rows or test with a known lead).
- Update the memory file with Phase 2 Step 1 completion status.

### Files Changed
- **New migration**: `supabase/migrations/xxx_enable_pg_cron_pg_net.sql` (extensions + unique index)
- **SQL insert** (non-migration): cron.schedule call
- **Memory update**: `.lovable/memory/features/revenue-os-phase1.md` → rename/extend to cover Phase 2

### What We Are NOT Doing Here
- Modifying `process-webhook/index.ts` — it already has retry logic, backoff, dead-lettering, and audit logging. That's done.
- Building the observability dashboard — that's Prompt 3.

