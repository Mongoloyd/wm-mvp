

# Phase 1A: Business Event Architecture — Scaffold

## Summary
Create two new files that establish the canonical business-event layer. No existing files are modified. No vendor SDKs, no GTM snippet, no CAPI wiring.

## Repo Compatibility Check (all clear)
- `getLeadId()` — exported from `src/lib/useLeadId.ts` as a pure sync function. Ready to import.
- `getUtmPayload()` — exported from `src/lib/useUtmCapture.ts` as a pure sync function returning `Record<string, string>`. Ready to import.
- `Window.dataLayer` — already declared in `src/types/analytics.d.ts` as `Record<string, unknown>[]`. No type changes needed.
- No mismatches. No adapter changes required.

## Files to Create

### 1. `src/lib/tracking/events.ts`
Typed event name constants and payload interface.

```
- Export a const object `BUSINESS_EVENTS` mapping each canonical event name:
  virtual_page_view, scan_initiated, quote_uploaded, otp_started,
  otp_sent, phone_verified, teaser_viewed, report_revealed,
  contractor_match_requested, appointment_booked, sold

- Export a TypeScript interface `BusinessEventPayload`:
  event: string (the event name)
  event_id: string (for dedup)
  lead_id: string
  route: string
  utm: Record<string, string> (from getUtmPayload)
  timestamp: string (ISO)
  [key: string]: unknown (extensible metadata)
```

### 2. `src/lib/tracking/trackBusinessEvent.ts`
Single canonical function that pushes to `window.dataLayer`.

```
- Import getLeadId from @/lib/useLeadId
- Import getUtmPayload from @/lib/useUtmCapture
- Import BUSINESS_EVENTS type from ./events

- Export generateEventId(): string
  Format: `wm_${Date.now()}_${crypto.randomUUID().slice(0,8)}`
  Uses crypto.randomUUID (browser-native) to avoid importing uuid lib

- Export trackBusinessEvent(eventName, metadata?): string
  1. Generate event_id
  2. Get lead_id via getLeadId()
  3. Get utm payload via getUtmPayload()
  4. Build full payload matching BusinessEventPayload
  5. Push to window.dataLayer
  6. Return event_id (caller can use later for CAPI relay)
  7. Console.debug log in dev for observability
```

### 3. `src/lib/tracking/index.ts` (barrel)
Re-exports from both files for clean imports:
```
export { BUSINESS_EVENTS, type BusinessEventPayload } from './events'
export { trackBusinessEvent, generateEventId } from './trackBusinessEvent'
```

## What is NOT touched
- No existing files modified
- No legacy files deleted
- No GTM snippet added to index.html
- No capiRelay.ts created
- No consumer migration (UploadZone, VerifyGate, etc. stay as-is)

## Design Decisions
- **`crypto.randomUUID()`** over `uuid` library — browser-native, no extra import, supported in all modern browsers. Avoids coupling to the uuid package.
- **Flat `src/lib/tracking/`** namespace — keeps business events cleanly separated from operational telemetry (`trackEvent.ts`) at the file-tree level.
- **`event_id` format `wm_{timestamp}_{random8}`** — human-debuggable prefix, sufficient entropy for dedup, matches what GTM will forward to Meta's `eventID` parameter.

