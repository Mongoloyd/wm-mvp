/**
 * Safe hook to access ScanFunnelContext without throwing.
 * Returns null when used outside a ScanFunnelProvider.
 * Extracted to its own module to avoid Vite HMR cache issues.
 */
import { useContext } from "react";

// Re-create a minimal reference to avoid circular/stale cache issues
// This context is the same object created in ScanFunnelContext.tsx
// We import it dynamically to ensure Vite picks up the latest version
export { ScanFunnelContext } from "./ScanFunnelContext";

import { ScanFunnelContext } from "./ScanFunnelContext";

import type { ScanFunnelState, ScanFunnelActions } from "./ScanFunnelContext";

type ScanFunnelContextValue = ScanFunnelState & ScanFunnelActions;

export function useScanFunnelSafe(): ScanFunnelContextValue | null {
  return useContext(ScanFunnelContext);
}
