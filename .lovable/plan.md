# Phase 1 — Full Report Reveal (Post-OTP)

## Summary
Phase 1 unlocks the full Truth Report for SMS-verified users, creating a clear upgrade path from **validation** (pre-OTP) to **evaluation** (post-OTP).

## Pre-OTP vs Post-OTP Contract

| Element | Pre-OTP (Preview) | Post-OTP (Full) |
|---|---|---|
| Grade letter | ✅ Shown | ✅ Shown |
| Grade verdict | ✅ Shown | ✅ Shown |
| Pillar status bands | ✅ PASS/WARN/FAIL | Replaced by numeric scores |
| Numeric pillar scores | ❌ Hidden | ✅ Shown with score rings |
| Confidence % | ❌ Hidden | ✅ Shown in header |
| Summary chips | ✅ Affirmative only | ✅ All (including missing) |
| Proof-of-read strip | ✅ Presence-based | ✅ With numeric counts |
| Flag list | ❌ Behind LockedOverlay | ✅ Expandable with details + tips |
| Negotiation script | ❌ Hidden | ✅ Personalized script |
| Contractor match CTA | ✅ Visible | ✅ Visible |
| PPO / price delta | ❌ Hidden | ✅ Labeled as analysis |

## Phase 1 Scope

### 1. SMS OTP Integration (Hard Gate)
- Wire real Twilio Verify via `send-otp` and `verify-otp` edge functions
- ScanTheatrics OTP phase calls `send-otp` on render
- OTP submit calls `verify-otp`, updates `phone_verifications`
- On success: `useReportAccess` reads verification state → returns "full"
- Backend: `get_analysis_preview` stays as-is; new `get_full_analysis` RPC gated by `phone_verified_at`

### 2. Full Report Data (get_full_analysis RPC)
- New RPC: `get_full_analysis(p_scan_session_id, p_phone_e164)`
- Returns `full_json` only if `phone_verifications.verified_at IS NOT NULL` for matching phone
- `full_json` contains: numeric pillar scores, all flags with tips, PPO, price delta, negotiation data
- Frontend: `useAnalysisData` gains a `fetchFull()` method triggered post-verification

### 3. Quantitative Metrics (Post-OTP Only)
- **Price Per Opening (PPO)**: `total_quoted_price / opening_count`
- **Market Delta**: `dollar_delta` from analyses table
- **Pillar Scores**: Exact 0-100 with animated score rings
- All labeled clearly as "WindowMan Analysis" — not absolute truth

### 4. UX Unlock Sequence
1. User completes OTP → success animation
2. LockedOverlay dissolves with fade transition
3. Pillar circles animate from status-band to numeric scores
4. Flag cards expand to show full details + tips
5. Negotiation script section fades in
6. Confidence % appears in header

### 5. Full Flag Details
- Each flag shows: severity badge, pillar tag, detail text, actionable tip
- Expandable accordion (already built in TruthReport)
- Post-OTP: all flags visible, no blur/lock

### 6. Negative Signal Rules (Post-OTP)
- Summary chips can now show: "WARRANTY: NOT FOUND", "PERMITS: MISSING"
- Quality band shows all values including "poor"
- Proof-of-read strip shows numeric counts: "4 pages · 8 openings · 12 line items"

## Files to Change
| File | Change |
|---|---|
| `supabase/functions/send-otp/index.ts` | New: Twilio Verify send |
| `supabase/functions/verify-otp/index.ts` | Update: verify + update phone_verifications |
| `supabase/migrations/` | New RPC: `get_full_analysis` |
| `src/hooks/useAnalysisData.ts` | Add `fetchFull()` for post-OTP data |
| `src/hooks/useReportAccess.ts` | Read real verification state |
| `src/components/ScanTheatrics.tsx` | Wire real OTP send/verify |
| `src/components/TruthReport.tsx` | Animate unlock transition |
| `src/pages/Index.tsx` | Orchestrate OTP → full report flow |

## What Does NOT Change
- Preview contract (Phase 0.7 locked)
- Scoring logic in scan-quote
- Dev bypass system
- Demo page (always preview mode)
