# Revenue OS Phase 2 — Webhook Automation

## Step 1: Webhook Scheduler (Completed 2026-04-04)

### Extensions Enabled (Migration)
- `pg_cron` (in `pg_catalog`) — for scheduled database jobs
- `pg_net` (in `extensions`) — for HTTP requests from SQL

### Cron Job: `process-webhooks-every-minute`
- Job ID: 3, active: true
- Schedule: `* * * * *` (every 60 seconds)
- Calls `process-webhook` Edge Function via `net.http_post`
- Uses **anon key** (not service role) — the function creates its own service-role client internally

### Idempotency Constraint
- Unique partial index `idx_webhook_deliveries_lead_event_unique` on `(lead_id, event_type)`
- Excludes rows with status `delivered`, `mock_delivered`, or `dead_letter`
- Prevents duplicate pending/failed webhook deliveries for the same lead+event

### Trigger Chain Verified
- `trg_fire_crm_handoff` on `leads` table — fires when `phone_verified` becomes true AND `latest_analysis_id` is set
- Inserts into `webhook_deliveries` with status `pending` and event_type `qualified_lead`
- `process-webhook` picks up pending/failed rows, delivers payload with HMAC-SHA256 signature
- Supports mock mode (logs payload when `CRM_WEBHOOK_URL` is absent)

### Full Automation Flow
1. Homeowner verifies phone → `leads.phone_verified = true`
2. If `latest_analysis_id` is set → `fire_crm_handoff` trigger queues `webhook_deliveries` row
3. Within 60s → `pg_cron` invokes `process-webhook`
4. Edge function delivers payload to CRM with HMAC signature (or logs in mock mode)
5. Failed deliveries retry with exponential backoff (30s, 2m, 10m, 1h, 6h) up to 5 attempts
6. After 5 failures → dead-lettered for manual review
