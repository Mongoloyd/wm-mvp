
# Enterprise Lockdown & Monetization — 6-Step Execution Plan

## Status: Steps 1 & 2 ✅ Complete — Awaiting approval for Steps 3 & 4

---

## Step 1: Add `ip_address` column to `phone_verifications` ✅
- Migration deployed — column added for IP-based rate limiting.

## Step 2: Tighten rate limiter + session/IP binding ✅
- `MAX_SENDS_PER_WINDOW`: 5 → **3**
- `WINDOW_MINUTES`: 10 → **15**
- Added `MAX_IP_SENDS_PER_WINDOW = 10` (secondary layer)
- `send-otp` now parses `scan_session_id` and `x-forwarded-for` from request
- IP stored on each `phone_verifications` insert
- `usePhonePipeline.ts` now sends `scan_session_id` in the `send-otp` payload

### Rate Limit Layers
| Dimension | Threshold | Window |
|-----------|-----------|--------|
| Per phone_e164 | 3 sends | 15 min |
| Per IP (secondary) | 10 sends | 15 min |
| Cooldown (per phone) | 30 sec | — |

## Step 3: Create `webhook_deliveries` table ⏳
- Table with RLS (internal operators only)
- Tracks: lead_id, event_type, status, payload_json, attempt_count, retry schedule

## Step 4: `fire_crm_handoff` trigger on `leads` ⏳
- Dual-gate: fires only when `phone_verified = true` AND `latest_analysis_id IS NOT NULL`
- Inserts row into `webhook_deliveries` with status `pending`

## Step 5: `process-webhook` Edge Function ⏳
- HMAC-SHA256 signing
- Dry-run mode: if `CRM_WEBHOOK_URL` is missing or `'mock'`, logs payload and sets status to `mock_delivered`
- Exponential backoff retries (5 max)

## Step 6: CRM secrets + end-to-end test 🔒 Deferred
