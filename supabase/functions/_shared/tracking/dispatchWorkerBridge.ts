/**
 * dispatchWorkerBridge.ts — Edge-function bridge to the canonical dispatch worker.
 *
 * Mirrors the pattern used by `canonicalBridge.ts`. The Supabase edge bundler
 * ships `_shared/` and the `src/` paths it transitively imports; reaching into
 * `src/` directly from a sibling edge function does not work reliably. This
 * bridge gives the dispatch edge function a stable, deno-friendly entry point.
 *
 * Re-exports only what `dispatch-platform-events/index.ts` consumes.
 */

export {
  fetchWithTimeout,
  runDispatchWorker,
} from "../../../../src/lib/tracking/canonical/dispatchWorker.ts";

export type {
  DBLike,
  DispatchRowWithEvent,
  VendorSendResult,
} from "../../../../src/lib/tracking/canonical/dispatchWorker.ts";
