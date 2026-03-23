# Production Refactor — Implementation Tracker

## Block 2.1: Route Changes (App.tsx)
- [x] Replace App.tsx: remove V2 routes, add ReportRedirect, remove Demo import (note: FacebookConversionProvider removed — component doesn't exist yet)

## Block 2.2: Supabase Migration
- [x] Create migration SQL: redact get_analysis_preview, create get_analysis_full, enable RLS

## Block 2.3: Frontend Data Hooks
- [x] Rewrite useAnalysisData.ts: two-phase fetch (preview + gated full)
- [x] Rewrite useReportAccess.ts: depend on isFullLoaded instead of phoneStatus

## Block 2.4: ScanTheatrics Cleanup
- [x] Remove "otp" from Phase type
- [x] Remove OTP state declarations (otpValues, skippedOtp, otpRefs)
- [x] Change cliffhanger transition: skip otp, go directly to startPillars()
- [x] Delete fake OTP handler functions
- [x] Simplify startPillars (remove skipped param)
- [x] Delete OTP phase JSX and "Unlock Full Report" button in reveal phase

## Block 2.5: PostScanReportSwitcher + Index.tsx
- [x] Rewrite PostScanReportSwitcher: remove Findings branch, wire onVerified/isFullLoaded
- [x] Edit Index.tsx: wire fetchFull/isFullLoaded into PostScanReportSwitcher

## Block 2.5b: ReportClassic.tsx + reportMode.ts
- [x] Edit ReportClassic.tsx: wire two-phase fetch, remove ReportVersionToggle, add auto-fetch
- [x] Edit reportMode.ts: set USE_FINDINGS_V2 = false

## Block 2.6: Delete Deprecated Files
- [x] Delete src/pages/Report.tsx
- [x] Delete src/pages/Demo.tsx
- [x] Delete src/components/ReportVersionToggle.tsx
- [x] Delete src/components/findings-gate/ (entire directory — 5 files)
- [x] Delete src/components/report-v2/ (entire directory — 10 files)
- [x] Delete src/lib/report-fixtures.ts (orphaned)
- [x] Delete src/lib/findings-transform.ts (orphaned)
- [x] Keep src/types/report-v2.ts (OtpVerifyOutcome still used by ReportClassic)
- [x] Keep src/components/TruthReportFindings/ (still used by DemoClassic)

## Verification
- [ ] tsc --noEmit exits 0
- [ ] vite build exits 0
- [ ] Commit and push to GitHub
