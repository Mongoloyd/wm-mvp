

## Plan: Delete XRayScannerBackground

### Findings

The component `XRayScannerBackground` is **only defined** in its own file. No other `.tsx` or `.ts` file imports or references it — it is already unused.

### Action

1. **Delete** `src/components/XRayScannerBackground.tsx`

No import removals needed anywhere. The build will remain clean.

