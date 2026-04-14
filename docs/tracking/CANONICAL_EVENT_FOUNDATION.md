# Canonical Event Foundation (Sprint 1)

## Scope Added
This sprint adds schema-only foundation primitives for canonical business events and quote trust persistence.

### New enum types
- `public.wm_event_name`
- `public.wm_anomaly_status`
- `public.wm_dispatch_status`
- `public.wm_platform_name`

### New tables
- `public.wm_event_log`
  - Canonical internal event ledger keyed by `event_id`.
  - Stores context IDs (`lead_id`, `scan_session_id`, `analysis_id`, `quote_file_id`) plus trust/anomaly outputs and payload snapshots.
- `public.wm_quote_facts`
  - One row per analyzed quote (`analysis_id` unique).
  - Stores normalized quote facts, trust inputs, trust outputs, anomaly status, and approval flags.
- `public.wm_quote_reviews`
  - Manual review queue for non-safe quote outcomes.
- `public.wm_pricing_index_snapshots`
  - Versioned storage of cohort stats and pricing bands.
- `public.wm_platform_dispatch_log`
  - Outbound dispatch audit log schema; no dispatch worker included.

## Security & compatibility
- Migration is additive only.
- Existing Verify-to-Reveal flow is untouched.
- Existing `public.update_updated_at()` trigger function is reused.
- RLS is enabled on all new tables with service-role policy for backend-only access.

## Deferred work
### Sprint 2 (deferred)
- Canonical event creation service wiring.
- Mapper implementations for downstream ad platforms.
- Routing logic between canonical event write path and mapper path.

### Sprint 3 (deferred)
- Dispatch queue + retries.
- Platform delivery workers.
- Backfill/replay tooling.
