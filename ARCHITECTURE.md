# WindowMan MVP — System Architecture Overview

> **Document status:** Living reference, current as of commit `1375458` on `main`.
> **Last updated:** March 22, 2026.

---

## 1. Core Function and Value Proposition

WindowMan is a **consumer-facing AI quote analysis tool** for the residential window and door replacement market. Homeowners upload a contractor's written quote (PDF or photo), and the system returns a forensic-grade analysis that grades the quote, flags pricing anomalies, identifies missing warranty and permit language, and benchmarks the bid against county-level market data.

The product's value proposition rests on three pillars:

**Trust asymmetry resolution.** Homeowners typically receive one or two quotes and have no way to evaluate whether the pricing, scope, or contract terms are fair. WindowMan acts as an impartial AI auditor that reads the quote the way a seasoned industry professional would.

**Lead qualification engine.** Every user who uploads a quote and verifies their phone number becomes a high-intent, pre-qualified lead. The OTP gate ensures phone validity before the full report is revealed, creating a verified lead record that can be routed to vetted contractors.

**Dual-report A/B architecture.** The system maintains two complete report renderers — a "Classic" view (single-page, pillar-scored, locked-overlay gate) and a "V2 Findings" view (progressive-disclosure shell with section-level blur and rich OTP modal). Both share the same Twilio verification engine and Supabase data layer, allowing real-time A/B comparison via a floating version toggle.

---

## 2. End-to-End User Flow

The user journey proceeds through five distinct phases. Each phase is owned by a specific component or page, and the handoff points are clearly defined.

### Phase 1: Landing Page Acquisition

The landing page (`/`, rendered by `src/pages/Index.tsx`) presents two parallel acquisition funnels wrapped in a `<ScanFunnelProvider>`:

| Flow | Entry Point | Purpose |
|------|-------------|---------|
| **Flow A** ("I have a quote") | `AuditHero` | Direct path to quote upload. User scrolls through social proof, then enters the `TruthGateFlow` configuration wizard. |
| **Flow B** ("I'm still shopping") | `FlowBEntry` → `MarketBaselineTool` | Educational path. User answers county/window/project questions to see market baseline data, then optionally converts to Flow A. |

Both flows converge at the same destination: a verified lead with a `scan_session_id`.

### Phase 2: Lead Capture and Phone Verification (TruthGateFlow)

`TruthGateFlow` is a 5-step inline wizard that collects project metadata (window count, project type, county, quote range) followed by a lead capture form (first name, email, phone). On submission:

1. The phone is screened and normalized via `usePhonePipeline("validate_and_send_otp")`.
2. A `leads` row is inserted into Supabase with the generated `session_id`.
3. The OTP is sent via the `send-otp` Edge Function (which calls Twilio Verify).
4. The phone and session are written into `ScanFunnelContext` for downstream persistence.
5. `onLeadCaptured(sessionId)` fires, revealing the upload zone.

### Phase 3: Quote Upload and AI Scan

`UploadZone` accepts the file (PDF, JPEG, PNG, WebP, HEIC; max 10 MB), uploads it to Supabase Storage (`quotes` bucket), creates a `quote_files` row and a `scan_sessions` row, then invokes the `scan-quote` Edge Function. The user sees `ScanTheatrics` — an animated scanning visualization — while the backend processes the document.

`useAnalysisData` polls the `get_analysis_preview` RPC up to 8 times (2.5-second intervals) until the analysis is ready. Once data arrives, the scan theatrics resolve and the report is revealed.

### Phase 4: Report Display (The "Y" Branch)

After the scan completes, the user sees the report. There are **three entry points** into the report, all sharing the same Twilio engine:

| Entry Point | Route | Smart Container | Renderer |
|-------------|-------|-----------------|----------|
| **In-page (post-scan)** | `/` (same page) | `PostScanReportSwitcher` | `TruthReportClassic` or `TruthReportFindings` |
| **Standalone V2** | `/report/:sessionId` | `Report.tsx` | `FindingsPageShell` → `ReportShellV2` |
| **Standalone Classic** | `/report/classic/:sessionId` | `ReportClassic.tsx` | `TruthReportClassic` |

In all three cases, the **smart container** owns `usePhonePipeline` and passes only dumb props (callbacks, display values, gate state) to the **renderer**. The renderer has zero knowledge of Twilio, Supabase, or any network layer.

### Phase 5: OTP Gate and Full Reveal

If the user has not yet verified their phone (or if they arrive at a standalone report URL without prior verification), the report renders in **preview/partial-reveal mode**:

- **Classic route:** `LockedOverlay` covers the report with a blurred findings preview and an OTP entry card. The gate has three modes: `enter_code` (OTP already sent), `send_code` (phone known, OTP not yet sent), and `enter_phone` (rare fallback).
- **V2 route:** `FindingsPageShell` renders the top findings unlocked but blurs the action plan, evidence, and benchmarks sections behind `BlurGate` overlays with `LockedSectionTeaser` cards. `OtpUnlockModal` appears as a centered overlay.

On successful OTP verification, the pipeline returns `"verified"`, the gate transitions to `"unlocked"`, and the full report is revealed. The funnel context is updated (`phoneStatus: "verified"`), which also flips `useReportAccess` from `"preview"` to `"full"`.

---

## 3. Frontend Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 8.0.0 |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI primitives) |
| Routing | React Router DOM v6 |
| Server State | TanStack Query v5 |
| Client State | Zustand (persisted), React Context (session-scoped) |
| Animation | Framer Motion |
| Backend | Supabase JS v2 (client SDK) |
| Testing | Vitest + Testing Library + Playwright |
| Fonts | Barlow Condensed, DM Mono, DM Sans |

### Route Map

```
/                              → Index.tsx (landing page + in-page report)
/demo                          → Demo.tsx
/demo-classic                  → DemoClassic.tsx
/report/:sessionId             → Report.tsx (V2 Findings standalone)
/report/classic/:sessionId     → ReportClassic.tsx (Classic standalone)
*                              → NotFound.tsx
```

All routes are wrapped in `QueryClientProvider`, `TooltipProvider`, and toast providers at the `App.tsx` level. The `ScanFunnelProvider` wraps only the landing page (`Index.tsx`), not the standalone report routes — those use `useScanFunnelSafe()` which returns `null` when outside the provider, gracefully degrading to pipeline-only phone resolution.

### The "Y" Architecture

The system's most distinctive architectural pattern is what we call the **"Y" architecture**: a single shared Twilio/Supabase verification engine that branches into two completely independent UI renderers.

```
                    ┌─────────────────────────┐
                    │   usePhonePipeline()    │
                    │   (Twilio Engine)        │
                    │                         │
                    │  submitPhone()          │
                    │  submitOtp()            │
                    │  resend()               │
                    │  reset()                │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    Smart Container       │
                    │  (Page-level component)  │
                    │                         │
                    │  Maps pipeline results   │
                    │  to UI-safe props        │
                    └─────┬───────────┬───────┘
                          │           │
              ┌───────────┘           └───────────┐
              ▼                                   ▼
   ┌─────────────────────┐           ┌─────────────────────┐
   │   V2 Findings UI    │           │   Classic UI         │
   │                     │           │                     │
   │  FindingsPageShell  │           │  TruthReportClassic │
   │  OtpUnlockModal     │           │  LockedOverlay      │
   │  ReportShellV2      │           │                     │
   │  BlurGate           │           │                     │
   └─────────────────────┘           └─────────────────────┘
```

There are **three smart containers** that sit at the stem of the Y:

| Smart Container | Location | When Used |
|-----------------|----------|-----------|
| `PostScanReportSwitcher` | `src/components/post-scan/` | In-page report after scan completes on the landing page |
| `Report.tsx` | `src/pages/` | Standalone V2 route (`/report/:sessionId`) |
| `ReportClassic.tsx` | `src/pages/` | Standalone Classic route (`/report/classic/:sessionId`) |

All three instantiate `usePhonePipeline("validate_and_send_otp", ...)` with the same options pattern, build the same callback shapes, and pass them down. The renderers are completely interchangeable — they never import `usePhonePipeline`, `supabase`, or any network module.

### Component Directory (V2)

The V2 Findings UI lives in two directories:

**`src/components/findings-gate/`** — Gate orchestration layer:

| Component | Responsibility |
|-----------|---------------|
| `FindingsPageShell` | Owns `gateState` and `reportMode`, manages OTP countdown timer, maps `OtpVerifyOutcome` to `GateState` transitions, computes `displayReport` with partial-reveal flags, renders `ReportRevealContainer` + `OtpUnlockModal` |
| `OtpUnlockModal` | Pure 6-digit OTP input with digit-by-digit focus, paste detection, auto-submit, and visual error states. Calls `onSubmitCode` (returns `Promise<OtpVerifyOutcome>`) and `onResend` |
| `BlurGate` | CSS blur overlay for individual report sections in partial-reveal mode |
| `LockedSectionTeaser` | Ghost-content placeholder cards for locked sections with unlock CTA |
| `ReportRevealContainer` | Wraps `ReportShellV2` with animation transitions between locked and unlocked states |

**`src/components/report-v2/`** — Report visual components:

| Component | Responsibility |
|-----------|---------------|
| `ReportShellV2` | Top-level layout that arranges all report sections and applies locked/unlocked rendering |
| `VerdictHeader` | Grade badge, verdict copy, and confidence score display |
| `TrustStrip` | Proof-of-read indicators and document metadata |
| `TopFindings` | Primary findings list (always visible, even in partial reveal) |
| `FindingCard` | Individual finding with severity badge, description, and evidence link |
| `CoverageMap` | Visual pillar coverage grid |
| `ActionPlan` | Recommended next steps (locked in partial reveal) |
| `EvidenceExplorer` | Detailed evidence viewer (locked in partial reveal) |
| `BenchmarksPanel` | County-level market comparison (locked in partial reveal) |
| `UnlockCTA` | Inline call-to-action to trigger OTP verification |

### OTP Callback Contract

The V2 system uses a **rich outcome contract** rather than a simple boolean:

```typescript
type OtpVerifyOutcome = "verified" | "invalid" | "expired" | "error";
```

The smart container maps `PipelineVerifyResult.status` to `OtpVerifyOutcome`:

| Pipeline Status | OTP Outcome | Gate Transition |
|-----------------|-------------|-----------------|
| `verified` | `"verified"` | → `unlocked` |
| `invalid_code` | `"invalid"` | → `otp_invalid` |
| `expired` | `"expired"` | → `otp_expired` |
| `error` | `"error"` | → stays current + shows error |

---

## 4. State Management and Data Flow

The application uses three complementary state systems, each scoped to a different lifecycle:

### 4.1 ScanFunnelContext (Session-Scoped, Provider-Based)

**File:** `src/state/scanFunnel.tsx`

This is the **primary state system** for the active scan session. It is a React Context provider that wraps the landing page (`<ScanFunnelProvider>` in `Index.tsx`) and tracks:

| Field | Type | Purpose |
|-------|------|---------|
| `phoneE164` | `string \| null` | Verified E.164 phone number |
| `phoneStatus` | `PhoneFunnelStatus` | `none → validated → otp_sent → verified` |
| `leadId` | `string \| null` | Supabase lead row ID |
| `sessionId` | `string \| null` | Lead session ID (from `TruthGateFlow`) |
| `scanSessionId` | `string \| null` | Scan session ID (from `UploadZone`) |
| `quoteFileId` | `string \| null` | Uploaded file ID |

**Persistence:** Three fields (`phoneE164`, `phoneStatus`, `sessionId`) are persisted to `localStorage` with a `wm_funnel_` prefix and a **24-hour expiry**. This means a user who closes their browser and returns within 24 hours will have their phone and session restored — enabling the standalone report routes to bootstrap from persisted state.

**Safe access:** `useScanFunnelSafe()` returns `null` when called outside the provider, which is the case for standalone report routes (`/report/:sessionId`, `/report/classic/:sessionId`). The smart containers handle this gracefully by falling back to pipeline-only phone resolution.

### 4.2 useFunnelStore (Zustand, Persisted)

**File:** `src/store/useFunnelStore.ts`

A broader Zustand store that tracks the **intelligence payload** collected during the funnel:

| Category | Fields |
|----------|--------|
| Project metadata | `windowCount`, `projectType`, `county`, `quoteRange`, `processStage` |
| Routing | `assignedFlow` (A/B), `currentScreen` |
| Milestones | `isLeadCaptured`, `isQuoteUploaded`, `isScanComplete`, `phoneVerified` |
| UTM | `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm` |

**Persistence strategy:** Uses `zustand/persist` with `localStorage`. The partialization is strict and security-conscious:

- **Persisted:** Non-PII fields (project metadata, flow assignment, milestones, UTM).
- **Excluded:** PII (`phoneE164`), Supabase row IDs (`leadId`, `scanSessionId`), navigation state (`currentScreen`), and scan results.

This store also exports `UTM_COUNTY_MAP` and `COUNTY_VERDICT_DATA` for county-level market intelligence used by `MarketBaselineTool`.

### 4.3 usePhonePipeline (Hook-Scoped, Ephemeral)

**File:** `src/hooks/usePhonePipeline.ts`

This is the **Twilio engine** — a React hook that encapsulates the entire phone verification lifecycle. It is instantiated fresh by each smart container and does not persist state across page navigations (that is the job of `ScanFunnelContext`).

**API surface:**

| Method/Property | Type | Purpose |
|-----------------|------|---------|
| `displayValue` | `string` | Formatted phone for display (e.g., `(561) 468-5571`) |
| `e164` | `string \| null` | Normalized E.164 phone |
| `phoneStatus` | `PhoneStatus` | `idle → screening → valid → sending_otp → otp_sent → verifying → verified` |
| `submitPhone()` | `→ PipelineStartResult` | Screen, normalize, optionally send OTP |
| `submitOtp(code)` | `→ PipelineVerifyResult` | Verify 6-digit code against `verify-otp` Edge Function |
| `resend()` | `→ void` | Re-send OTP (respects 30-second cooldown) |
| `reset()` | `→ void` | Clear all state back to idle |
| `resendCooldown` | `number` | Seconds remaining before resend is allowed |

**Phone resolution priority:** The hook accepts an `externalPhoneE164` option. When set (from `ScanFunnelContext`), it takes priority over local input, enabling the "seamless continuation" UX where the user does not re-enter their phone on the report page.

### Data Flow Diagram

```
localStorage (24h TTL)
    │
    ├── wm_funnel_phoneE164
    ├── wm_funnel_phoneStatus
    └── wm_funnel_sessionId
            │
            ▼
    ScanFunnelContext ──────────────────────────────────┐
    (session-scoped, provider-based)                    │
            │                                           │
            │  phoneE164, phoneStatus                   │
            ▼                                           │
    usePhonePipeline ◄── externalPhoneE164              │
    (hook-scoped, ephemeral)                            │
            │                                           │
            │  submitOtp() → Supabase Edge Function     │
            │  resend()    → Supabase Edge Function     │
            ▼                                           │
    Smart Container (Report.tsx / ReportClassic.tsx)     │
            │                                           │
            │  callbacks + display props                │
            ▼                                           │
    UI Renderer (FindingsPageShell / TruthReportClassic)│
            │                                           │
            │  onVerified callback                      │
            └──────────────────────────────────────────►│
                  funnel.setPhoneStatus("verified")     │
                  → persisted to localStorage           │
                  → useReportAccess() flips to "full"   │
```

---

## 5. The Backend Contract

The frontend communicates with the backend through **two narrow interfaces**: Supabase RPC functions and Supabase Edge Functions. At no point does the UI read raw table schemas or construct ad-hoc queries against the database.

### 5.1 Supabase Database Tables

The database contains seven tables:

| Table | Purpose |
|-------|---------|
| `analyses` | AI analysis results (grade, flags, full_json, preview_json, confidence_score, proof_of_read) |
| `event_logs` | Audit trail for all system events (OTP sent, scan invoked, etc.) |
| `leads` | Captured lead records (name, email, phone_e164, county, project metadata) |
| `phone_verifications` | OTP verification records |
| `quote_analyses` | Legacy/secondary analysis storage |
| `quote_files` | Uploaded file metadata (linked to storage bucket) |
| `scan_sessions` | Session records linking leads to quote files and analyses |

### 5.2 RPC Functions (Read Path)

The frontend reads data exclusively through server-side RPC functions, which act as a **view layer** over the raw tables:

| RPC Function | Input | Returns | Used By |
|--------------|-------|---------|---------|
| `get_analysis_preview` | `p_scan_session_id` | `confidence_score`, `document_type`, `flags`, `grade`, `preview_json`, `proof_of_read`, `rubric_version` | `useAnalysisData` hook |
| `get_lead_by_session` | `p_session_id` | `id` | `UploadZone` (to link quote file to lead) |
| `get_rubric_stats` | `p_days?` | Aggregate grading statistics | `useRubricStats` / `useTickerStats` |

This design means the frontend never sees `full_json` (the complete analysis payload) through the preview RPC — that field is gated behind a separate access check. The `preview_json` contains only the data needed for the locked/teaser view.

### 5.3 Edge Functions (Write Path and Twilio)

All mutations and external API calls go through Supabase Edge Functions, which run server-side and hold secrets (Twilio credentials, API keys):

| Edge Function | Purpose | Called By |
|---------------|---------|-----------|
| `send-otp` | Sends a 6-digit OTP via Twilio Verify to the provided `phone_e164`. Creates/updates a `phone_verifications` record. | `usePhonePipeline.submitPhone()`, `usePhonePipeline.resend()` |
| `verify-otp` | Verifies the OTP code against Twilio Verify. On success, marks the phone as verified in `phone_verifications` and optionally links to `scan_session_id`. | `usePhonePipeline.submitOtp()` |
| `scan-quote` | Triggers the AI analysis pipeline. Reads the uploaded file from storage, runs the rubric analysis, and writes results to `analyses`. | `UploadZone` (after file upload) |

### 5.4 Security Boundary

The architecture enforces a clear security boundary:

> **The frontend controls what the user sees. The backend controls what the user gets.**

`useReportAccess` is explicitly documented as a **cosmetic toggle, not a security boundary**. Even if a user bypasses the client-side gate (e.g., by setting `DEV_REPORT_BYPASS`), the backend independently gates `full_json` behind phone verification. The RPC `get_analysis_preview` returns only `preview_json` — the full analysis payload requires a separate, authenticated request that checks `phone_verifications`.

### 5.5 Direct Table Access (Limited)

A small number of direct table operations exist for write paths where RPC overhead is unnecessary:

| Operation | Table | Context |
|-----------|-------|---------|
| Insert lead | `leads` | `TruthGateFlow` after form submission |
| Insert quote file | `quote_files` | `UploadZone` after storage upload |
| Insert scan session | `scan_sessions` | `UploadZone` linking lead to file |
| Insert event log | `event_logs` | Various components for audit trail |
| Read session → lead → county | `scan_sessions`, `leads` | `ReportClassic.tsx` county resolution |

All direct table access is protected by Supabase Row Level Security (RLS) policies.

---

## Appendix: File Tree (Key Directories)

```
src/
├── pages/
│   ├── Index.tsx              # Landing page + in-page report
│   ├── Report.tsx             # V2 Findings standalone (smart container)
│   ├── ReportClassic.tsx      # Classic standalone (smart container)
│   ├── Demo.tsx               # Demo page
│   ├── DemoClassic.tsx        # Classic demo page
│   └── NotFound.tsx           # 404
│
├── components/
│   ├── findings-gate/         # V2 gate orchestration
│   │   ├── FindingsPageShell.tsx
│   │   ├── OtpUnlockModal.tsx
│   │   ├── BlurGate.tsx
│   │   ├── LockedSectionTeaser.tsx
│   │   └── ReportRevealContainer.tsx
│   │
│   ├── report-v2/             # V2 report visuals
│   │   ├── ReportShellV2.tsx
│   │   ├── VerdictHeader.tsx
│   │   ├── TrustStrip.tsx
│   │   ├── TopFindings.tsx
│   │   ├── FindingCard.tsx
│   │   ├── CoverageMap.tsx
│   │   ├── ActionPlan.tsx
│   │   ├── EvidenceExplorer.tsx
│   │   ├── BenchmarksPanel.tsx
│   │   └── UnlockCTA.tsx
│   │
│   ├── post-scan/             # In-page report switcher
│   │   └── PostScanReportSwitcher.tsx
│   │
│   ├── TruthReportClassic.tsx # Classic report renderer
│   ├── LockedOverlay.tsx      # Classic OTP gate UI
│   ├── ReportVersionToggle.tsx # Floating V2 ↔ Classic toggle
│   └── ui/                    # shadcn/ui primitives
│
├── hooks/
│   ├── usePhonePipeline.ts    # Twilio verification engine
│   ├── useAnalysisData.ts     # Analysis data fetcher + transformer
│   ├── useReportAccess.ts     # Preview vs full access level
│   ├── usePhoneInput.ts       # Phone input formatting
│   └── useScanPolling.ts      # Scan status polling
│
├── state/
│   ├── scanFunnel.tsx         # ScanFunnelContext (session state)
│   └── analysisViewMode.tsx   # Classic vs Findings toggle state
│
├── store/
│   ├── useFunnelStore.ts      # Zustand persisted funnel store
│   └── countyData.ts          # County-level market data
│
├── types/
│   └── report-v2.ts           # V2 type definitions (ReportEnvelope, GateState, OtpVerifyOutcome)
│
├── lib/
│   ├── findings-transform.ts  # Raw analysis → V2 ReportEnvelope transformer
│   ├── report-fixtures.ts     # Hardcoded fixtures for dev/demo
│   ├── reportMode.ts          # Report mode utilities
│   └── shadowPixel.ts         # Tracking pixel utility
│
├── utils/
│   ├── formatPhone.ts         # Phone formatting + maskPhone utility
│   └── screenPhone.ts         # Phone screening/validation
│
└── integrations/
    └── supabase/
        ├── client.ts          # Supabase client singleton
        └── types.ts           # Auto-generated database types

supabase/
└── functions/
    ├── scan-quote/            # AI analysis pipeline
    ├── send-otp/              # Twilio Verify send
    └── verify-otp/            # Twilio Verify check
```
