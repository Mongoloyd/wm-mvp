/**
 * dispatchWorkerBridge.ts — Edge-function bridge to the canonical dispatch worker.
 *
 * The Supabase edge bundler does not ship arbitrary `src/` paths to deployed
 * functions. To keep the canonical worker callable from edge functions, the
 * source modules are mirrored into `_shared/tracking/canonical/` (kept in
 * lockstep with `src/lib/tracking/canonical/*`). This bridge is the single
 * import surface the dispatch edge function consumes.
 */

export {
  fetchWithTimeout,
  runDispatchWorker,
} from "./canonical/dispatchWorker.ts";

export type {
  DBLike,
  DispatchRowWithEvent,
  VendorSendResult,
} from "./canonical/dispatchWorker.ts";
