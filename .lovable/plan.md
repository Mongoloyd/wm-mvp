
# Enterprise Lockdown & Monetization — 6-Step Execution Plan

## Status: Steps 1–5.5 + 7 ✅ Complete — Step 6 Deferred

---

## Step 1: Add `ip_address` column to `phone_verifications` ✅

## Step 2: Tighten rate limiter + session/IP binding ✅
| Dimension | Threshold | Window |
|-----------|-----------|--------|
| Per phone_e164 | 3 sends | 15 min |
| Per IP (secondary) | 10 sends | 15 min |
| Cooldown (per phone) | 30 sec | — |

## Step 3: `webhook_deliveries` table ✅
- RLS: internal operators + service_role only
- Tracks: lead_id, event_type, status, payload_json, attempt_count, retry schedule

## Step 4: `fire_crm_handoff` dual-gate trigger on `leads` ✅
- Fires when `phone_verified = true` AND `latest_analysis_id IS NOT NULL` (first time only)
- Inserts `qualified_lead` into `webhook_deliveries`
- Inserts `crm_handoff_queued` into `lead_events` with audit metadata

## Step 5: `process-webhook` Edge Function ✅
- HMAC-SHA256 signing via Web Crypto API
- Dry-run mode: `CRM_WEBHOOK_URL` missing or `'mock'` → logs payload, sets `mock_delivered`
- Live mode: real fetch with exponential backoff (30s, 2m, 10m, 1h, 6h)
- Dead-letter after 5 failed attempts
- Inserts `crm_handoff_mock_delivered`, `crm_handoff_delivered`, or `crm_handoff_failed` into `lead_events`

## Step 5.5: Admin Webhook Dashboard Widget ✅
- New "WEBHOOKS" tab in Admin Dashboard
- Summary cards: Pending, Delivered, Failed (Retrying), Dead Letter
- Delivery list with status pills, attempt counts, HTTP status, timestamps
- Realtime subscription on `webhook_deliveries` table

## Step 7: `lead_events` audit trail ✅
- `crm_handoff_queued` — from DB trigger (Step 4)
- `crm_handoff_mock_delivered` / `crm_handoff_delivered` / `crm_handoff_failed` — from Edge Function (Step 5)

## Step 6: CRM secrets + end-to-end test 🔒 Deferred
- Add `CRM_WEBHOOK_URL` and `CRM_WEBHOOK_SECRET` as Supabase secrets when CRM is ready
- Change URL from empty/`mock` to real endpoint to go live
