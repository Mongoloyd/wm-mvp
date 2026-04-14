# Dispatch Worker Runbook

## Worker location and execution model
- Worker entrypoint: `supabase/functions/dispatch-platform-events/index.ts`.
- Core logic module: `src/lib/tracking/canonical/dispatchWorker.ts`.
- Queue claim RPC: `public.wm_claim_dispatch_rows` from migration `supabase/migrations/20260414170000_wm_dispatch_worker.sql`.
- This follows existing Supabase Edge Function backend patterns and reuses the existing `capi-event` server bridge for Meta.

## Processing lifecycle
`wm_platform_dispatch_log.dispatch_status` lifecycle:
- `pending` -> ready for first attempt.
- `processing` -> row claimed atomically by worker (attempt count increments immediately).
- terminal outcomes:
  - `sent` when provider accepted payload.
  - `suppressed` when mapper suppresses or event is no longer eligible.
  - `failed` for retryable/non-terminal provider failure.
  - `dead_letter` once retry budget is exhausted.

`wm_event_log.dispatch_status` is synchronized from platform rows after each attempt:
- `pending` / `processing` / `failed` / `sent` / `suppressed` / `dead_letter`.

## Retry policy
- Attempt 1: immediate when eligible.
- Retry 1: +5 minutes.
- Retry 2: +30 minutes.
- Retry 3: +2 hours.
- Retry 4: +12 hours.
- After attempt budget is exhausted: `dead_letter`.

Retryable conditions:
- network timeout/abort.
- HTTP 429.
- HTTP 5xx.
- explicit transient bridge failure (`retryable: true`).

Non-retryable conditions:
- mapper suppression (`suppressed`).
- malformed payload/internal invalid state (`failed`, no retry).
- clearly invalid configuration (`failed`, no retry).

## Timeout behavior
All external fetches are bounded with `AbortController` timeout (default 7 seconds):
- Meta dispatch call to `functions/v1/capi-event`.
- Google dispatch call to `GOOGLE_ADS_DISPATCH_URL`.

## Operational checks
### Check queue backlog
```sql
select dispatch_status, platform_name, count(*)
from public.wm_platform_dispatch_log
group by dispatch_status, platform_name
order by dispatch_status, platform_name;
```

### Inspect failed rows
```sql
select id, event_log_id, platform_name, attempt_count, next_attempt_at, provider_response_code, error_message, updated_at
from public.wm_platform_dispatch_log
where dispatch_status = 'failed'
order by updated_at desc
limit 100;
```

### Inspect dead letters
```sql
select id, event_log_id, platform_name, attempt_count, provider_response_code, error_message, updated_at
from public.wm_platform_dispatch_log
where dispatch_status = 'dead_letter'
order by updated_at desc
limit 100;
```

### Verify event-level status sync
```sql
select id, event_id, event_name, dispatch_status, dispatch_attempted_at
from public.wm_event_log
where event_timestamp >= now() - interval '24 hours'
order by event_timestamp desc
limit 200;
```

## Manual trigger
Invoke worker edge function with service-role authorization:
```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/dispatch-platform-events" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Verify-to-Reveal guardrails
- Worker only uses canonical event rows already persisted by backend services.
- `report_revealed` canonical event is created only after OTP verification in `verify-otp`.
- Worker does not access or expose report `full_json`; dispatch payloads use canonical tracking payloads only.
