# QA Validation Checklist — Canonical Dispatch Worker

## Preconditions
- Sprint 1 and Sprint 2 migrations and edge functions are deployed.
- Sprint 3 migration `20260414170000_wm_dispatch_worker.sql` is applied.
- `dispatch-platform-events` edge function deployed.
- `META_PIXEL_ID` and `META_CAPI_TOKEN` configured for `capi-event`.
- `GOOGLE_ADS_DISPATCH_URL` configured for Google dispatch path (or explicitly accepted as deferred/non-configured).

## Core pipeline checks
- [ ] `lead_identified` canonical events are persisted by `qualify-homepage-lead`.
- [ ] `quote_uploaded` canonical events are persisted by `scan-quote` (note: `quote_upload_completed` is a compatibility-only / legacy alias, not the canonical forward event name).
- [ ] `quote_validation_passed` canonical events are persisted by `scan-quote`.
- [ ] `report_revealed` canonical event is persisted after successful OTP verification in `verify-otp`.

## Dispatch lifecycle checks
- [ ] Create at least one eligible canonical event and confirm `wm_platform_dispatch_log` row starts as `pending`.
- [ ] Run worker and confirm transition `pending -> processing -> sent` for successful provider response.
- [ ] Force retryable provider failure (429/5xx/timeout) and confirm `failed` with `next_attempt_at`.
- [ ] Repeat retryable failure to confirm backoff sequence:
  - [ ] +5m
  - [ ] +30m
  - [ ] +2h
  - [ ] +12h
- [ ] Confirm attempt beyond retry budget transitions to `dead_letter`.
- [ ] Force mapper suppression (e.g., weak identity) and confirm `suppressed` with reason.

## Duplicate and idempotency checks
- [ ] Confirm enqueue uses unique `(event_log_id, platform_name)` and upsert conflict key.
- [ ] Confirm worker does not resend rows already in `sent`.
- [ ] Confirm stale `processing` rows are recoverable only after lock staleness window.
- [ ] Confirm `event_id` remains unchanged from canonical event through dispatch payload (`event_id` for Meta, `transaction_id` for Google).

## Verify-to-Reveal protection checks
- [ ] Full report remains inaccessible until OTP verification succeeds.
- [ ] Preview remains available pre-OTP.
- [ ] `report_revealed` event only appears after verification timestamp is set.
- [ ] No worker code path reads or emits report `full_json`.

## Unsafe quote state checks
- [ ] For quote events with unsafe anomaly status/trust threshold failure, mapper suppression occurs.
- [ ] Unsafe canonical quote events do not dispatch to external vendors.

## SQL spot checks
```sql
-- recent dispatch rows
select id, event_log_id, platform_name, dispatch_status, attempt_count, next_attempt_at, error_message
from public.wm_platform_dispatch_log
order by updated_at desc
limit 100;

-- recent canonical rows with dispatch status
select id, event_id, event_name, dispatch_status, dispatch_attempted_at
from public.wm_event_log
order by event_timestamp desc
limit 100;
```

## Deferred event hooks (explicit)
- `appointment_booked`: deferred until backend-authoritative completion point is present.
- `sale_confirmed`: deferred until backend-authoritative completion point is present.
