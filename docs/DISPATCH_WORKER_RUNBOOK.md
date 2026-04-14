# Dispatch Worker Runbook

## Function
`supabase/functions/process-platform-dispatch/index.ts`

## Trigger mode
Run on a schedule (recommended every 1-5 minutes) or manual POST.

## Queue contract
Eligible rows are from `wm_platform_dispatch_log` where:
- status in `pending` or `failed`
- `next_retry_at` is null or due

## Retry schedule
Attempts follow bounded schedule:
1. immediate
2. +5 minutes
3. +30 minutes
4. +2 hours
5. +12 hours
Then dead-letter.

## Retryable failures
- network exceptions
- HTTP 429
- HTTP 5xx

## Non-retryable
- mapper suppression (`null` payload)
- malformed/unusable payload
- permanent platform configuration errors

## Observability
Inspect:
- `wm_platform_dispatch_log` for request/response/error history
- `wm_event_log.meta_dispatch_status`
- `wm_event_log.google_dispatch_status`

## Safe rollback
Disable worker schedule only. Canonical event creation still logs events and preserves queue state.
