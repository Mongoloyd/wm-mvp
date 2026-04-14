# Platform Mapper Rules

## Files
- `src/lib/tracking/canonical/mapToMeta.ts`
- `src/lib/tracking/canonical/mapToGoogle.ts`

## Meta mapper
Pure function: canonical event in, Meta-ready payload out.

Suppress when:
- `shouldSendMeta` is false
- no mapped Meta event name
- quote quality event is not safe
- quote trust below threshold
- identity quality is low/unknown
- missing usable user_data (hashed PII/click id/external id)

Uses:
- canonical `eventId` as Meta dedup `event_id`
- normalized hashed identity fields from canonical payload

## Google mapper
Pure function: canonical event in, Google conversion payload out.

Suppress when:
- `shouldSendGoogle` is false
- no mapped conversion action
- quote quality event is not safe
- quote trust below threshold
- no attribution identifiers (click-id and no hashed fallback)

Uses:
- canonical `eventId` as `transaction_id`
- click-id first (`gclid`, `gbraid`, `wbraid`)
- hashed identifier fallback (`emailHash`, `phoneHash`)

## Deferred to Sprint 3
- dispatch execution worker
- retry queue logic
- provider response reconciliation loop
