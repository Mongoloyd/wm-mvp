# Canonical Event Service

## File
- `src/lib/tracking/canonical/createCanonicalEvent.ts`

## What it does
`createCanonicalEvent` creates one deterministic canonical business event, applies trust + anomaly scoring for quote events, and persists to Sprint 1 canonical tables.

## Flow
1. Accepts `CreateCanonicalEventInput`.
2. Reuses `eventId` when provided; generates one when absent.
3. Normalizes/hashes identity (`identity.ts`).
4. Computes identity quality (`high`/`medium`/`low`/`unknown`).
5. Computes optimization value ladder (`valueModel.ts`).
6. Re-evaluates trust/anomaly for quote events when analytics + quote payload exist.
7. Inserts `wm_event_log`.
8. Upserts `wm_quote_facts` with explicit `onConflict: "analysis_id"`.
9. Inserts `wm_platform_dispatch_log` rows only for eligible platform dispatches.
10. Never sends vendor API calls.

## Enqueue vs suppress
Dispatch rows are enqueued only when:
- event is platform-eligible,
- identity quality is not low,
- quote quality event is safe and above trust threshold.

Otherwise the event is still recorded in `wm_event_log`, with `dispatch_status = not_applicable`.

## Deferred to Sprint 3
- queue worker
- retry scheduling/backoff
- platform send workers
