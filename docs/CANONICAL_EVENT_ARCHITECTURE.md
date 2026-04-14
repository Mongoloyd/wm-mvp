# Canonical Event Architecture

## Purpose
This layer adds a single canonical internal ledger (`wm_event_log`) and dispatch queue (`wm_platform_dispatch_log`) without replacing existing `event_logs`, GTM pushes, or Verify-to-Reveal access controls.

## Core rules implemented
1. `event_id` is canonical dedup key across ledger and platform dispatch.
2. Quote events with anomaly status other than `safe` are never dispatched to ad platforms.
3. Dispatch payloads are derived from canonical event payload, then mapped per platform.
4. Existing OTP/report gating remains unchanged (`get_analysis_full` still controls full report access).

## Data model
- `wm_event_log`: immutable canonical event stream and trust outcomes.
- `wm_quote_facts`: one row per analysis for normalized quote/trust factors.
- `wm_quote_reviews`: manual queue for review/quarantine items.
- `wm_pricing_index_snapshots`: versioned cohort metric snapshots.
- `wm_platform_dispatch_log`: queue + retries + response audit.

## Runtime flow
1. Backend-authoritative paths call `createCanonicalEvent`.
2. Service computes identity quality + trust/anomaly + optimization value.
3. Service persists canonical event and quote facts.
4. Service enqueues eligible platform dispatch rows.
5. `process-platform-dispatch` worker maps + sends payloads, retries failures, dead-letters exhausted rows.

## Existing systems intentionally preserved
- `event_logs` and GTM/browser tracking remain active.
- `capi-event` function remains available; this system adds a new controlled dispatch path.
- OTP and report reveal authorization logic are unchanged.
