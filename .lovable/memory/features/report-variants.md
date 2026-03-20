Naming convention and shared gate architecture for TruthReportClassic and TruthReportFindings

## Naming (locked)
- `TruthReportClassic` / `TruthReportFindings` — component names
- `classic` / `findings` — enum values in AnalysisViewMode
- Short refs: classic, findings
- NEVER use: v1, v2, alpha, bravo, legacy, new

## Files
- `src/components/TruthReportClassic.tsx` — default export `TruthReportClassic`
- `src/components/TruthReportFindings/TruthReportFindings.tsx` — named export `TruthReportFindings`
- `src/components/TruthReportFindings/VerifyBanner.tsx`
- `src/components/TruthReportFindings/VerifyGate.tsx`
- `src/components/TruthReportFindings/PhoneVerifyModal.tsx`

## Architecture
- Both reports are presentation-only — NO embedded OTP/phone logic
- `PostScanReportSwitcher` chooses variant via `useAnalysisViewMode()` and derives `accessLevel` via `useReportAccess()`
- `useReportAccess()` reads `ScanFunnelContext` (via `useScanFunnelSafe()`) for verification state
- Gate logic is centralized and identical for both variants
- Split test compares presentation only, not OTP/state behavior
