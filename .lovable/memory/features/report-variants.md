Naming (Locked)
Component Name: TruthReportClassic

View Mode: classic (Enum value in AnalysisViewMode)

Short Ref: classic

Prohibited Terms: NEVER use v1, v2, alpha, bravo, legacy, new, or findings.

Files
src/components/TruthReportClassic.tsx — Default export: TruthReportClassic.

src/components/LockedOverlay.tsx — Centralized gate UI used for report blurring/locking.

Note: All files previously in src/components/TruthReportFindings/ are deprecated/removed.

Architecture
Presentation Only: The report component is purely presentational. It contains NO embedded OTP, phone validation, or lead-generation logic.

Orchestration: PostScanReportSwitcher handles the top-level logic, choosing the classic variant and deriving accessLevel via the useReportAccess() hook.

State Access: useReportAccess() reads ScanFunnelContext (via useScanFunnelSafe()) to determine if the user has verified their phone and unlocked the full report.

Centralized Gating: Gate logic (blurring and "Unlock" CTAs) is handled by the LockedOverlay, ensuring consistent behavior across the funnel.
