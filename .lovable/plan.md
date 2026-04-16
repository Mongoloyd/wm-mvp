

## Root cause (confirmed)

`supabase/functions/dispatch-platform-events/index.ts` imports `dispatchWorker.ts` from `../../../src/lib/tracking/canonical/`. That file uses **extensionless relative imports** (`./mapToGoogle`, `./mapToMeta`, `./types`). Deno requires explicit `.ts` extensions on relative imports — the bundler resolves `dispatchWorker.ts` and then fails on the next hop.

The other transitively-pulled modules (`createCanonicalEvent.ts`, `identity.ts`, `anomaly.ts`, `trustScore.ts`, `valueModel.ts`, `schemas.ts`, `types.ts`, `mapToMeta.ts`, `mapToGoogle.ts`) all use the same extensionless pattern. The existing `_shared/tracking/canonicalBridge.ts` already imports from `src/` with explicit `.ts` extensions, so the cross-boundary pattern is already established and known to work — what's missing is just the extensions on the **internal** edges of the chain.

## Plan: build-compatibility fix only

Add explicit `.ts` extensions to every relative import inside `src/lib/tracking/canonical/*` that lives in the dispatch chain. No logic changes. No moves. No new bridges yet.

### Files to edit (10 total)

1. **`src/lib/tracking/canonical/dispatchWorker.ts`** — `./mapToGoogle` → `./mapToGoogle.ts`, `./mapToMeta` → `./mapToMeta.ts`, `./types` → `./types.ts`
2. **`src/lib/tracking/canonical/mapToMeta.ts`** — `./constants` → `./constants.ts`, `./types` → `./types.ts`
3. **`src/lib/tracking/canonical/mapToGoogle.ts`** — `./constants` → `./constants.ts`, `./types` → `./types.ts`
4. **`src/lib/tracking/canonical/createCanonicalEvent.ts`** — `.ts` on all 5 relative imports
5. **`src/lib/tracking/canonical/identity.ts`** — `./types` → `./types.ts`
6. **`src/lib/tracking/canonical/anomaly.ts`** — `./types` → `./types.ts`
7. **`src/lib/tracking/canonical/trustScore.ts`** — `.ts` on `./constants`, `./anomaly`, `./types`
8. **`src/lib/tracking/canonical/valueModel.ts`** — `./types` → `./types.ts`
9. **`src/lib/tracking/canonical/schemas.ts`** — `./constants` → `./constants.ts`
10. **`src/lib/tracking/canonical/types.ts`** — `./constants` → `./constants.ts`

### Why this is safe

- Vite/esbuild and Vitest natively support explicit `.ts` extensions on TypeScript relative imports. The repo already mixes both patterns (`canonicalBridge.ts` uses `.ts`).
- No runtime behavior changes. No bundle-output changes for the frontend.
- The Arc 1.5 measurement parity work (event_id sharing, value/currency on `quote_uploaded`, server-side `phone_verified` persistence, Meta/Google mappings for `phone_verified` + `report_revealed`) stays exactly as-is.
- Tests are not edited — they import these modules through the same Vite resolver, which handles either form.

### Fallback path (only if the `.ts` sweep does not resolve the deploy)

If Deno still rejects the chain after the extension fix, the architectural fix is to **stop importing `src/` directly from the new edge function**. Instead:
- Create `supabase/functions/_shared/tracking/dispatchWorkerBridge.ts` that re-exports `runDispatchWorker` and `fetchWithTimeout` from `src/lib/tracking/canonical/dispatchWorker.ts`.
- Update `supabase/functions/dispatch-platform-events/index.ts` to import from `../_shared/tracking/dispatchWorkerBridge.ts`, mirroring the pattern already used by `canonicalBridge.ts`.

I will not preemptively add this bridge; the `.ts` extension sweep is the minimal, scoped fix and matches Lovable's own diagnosis. Bridge-only if step 1 still fails after deploy.

### Out of scope

- No event-name, value-ladder, tracking-behavior, business-logic, UI, doc, or test changes.
- No edits to `dispatch-platform-events/index.ts` itself unless the bridge fallback is needed.
- No edits to `_shared/tracking/canonicalBridge.ts` or any other edge function.

