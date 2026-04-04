
# Enterprise Lockdown & Monetization — 6-Step Execution Plan

## Status: Steps 1–4 ✅ Complete — Awaiting approval for Step 5

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
- Tracks: lead_id, event_type, status, payload_json, attempt_count, retry schedule, last_http_status, last_error
- Auto-updates `updated_at` via trigger

## Step 4: `fire_crm_handoff` dual-gate trigger on `leads` ✅
- Fires on UPDATE when `phone_verified = true` AND `latest_analysis_id IS NOT NULL` (first time only)
- Inserts `qualified_lead` row into `webhook_deliveries`

## Step 5: `process-webhook` Edge Function ⏳
- HMAC-SHA256 signing
- Dry-run mode: if `CRM_WEBHOOK_URL` missing or `'mock'` → logs payload, sets status `mock_delivered`
- Exponential backoff retries (5 max)

## Step 6: CRM secrets + end-to-end test 🔒 Deferred
