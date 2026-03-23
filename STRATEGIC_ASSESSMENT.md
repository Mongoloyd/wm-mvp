# WindowMan: Strategic Assessment & Recommendations

**Author:** Manus AI
**Date:** March 22, 2026
**Scope:** Product vision, business model, user psychology, and top 5 strategic improvements — grounded in a line-by-line audit of the wm-mvp codebase (22,770 lines across 80+ source files).

---

## 1. Product Vision: What WindowMan Is Actually Building

### The One-Sentence Thesis

WindowMan is a **trust-asymmetry weapon** for Florida homeowners who suspect their impact window contractor is overcharging them — but have no way to prove it.

### The Deeper Read

The impact window replacement industry in South Florida operates in a pricing vacuum. There is no Kelley Blue Book, no Zillow Zestimate, no public benchmark that tells a homeowner whether a $28,000 quote for 12 windows is fair or predatory. Contractors know this. Homeowners feel it. The result is a market where the seller has near-total information advantage, and the buyer's only recourse is to collect 3-4 competing quotes — a process that takes weeks and still produces no objective baseline.

WindowMan attacks this asymmetry with a three-part product:

**Part 1: The Scanner.** A homeowner uploads a photo or PDF of their contractor's quote. A Supabase Edge Function (`scan-quote`) downloads the file, sends it to Google Gemini for structured extraction (line items, brands, DP ratings, NOA numbers, warranty terms, permit details), then runs a deterministic scoring algorithm across four pillars — Safety, Installation, Pricing, and Transparency — to produce a letter grade (A through F) and a set of specific red flags.

**Part 2: The Gate.** The grade is shown for free. The detailed findings — the specific flags, the dollar-level benchmarks, the action plan — are locked behind a phone verification wall powered by Twilio Verify. This is not authentication in the traditional sense; it is a **lead qualification mechanism**. A homeowner who verifies their phone number is signaling genuine purchase intent. The OTP gate converts an anonymous page view into a named, contactable, purchase-ready lead with a verified phone number, a county, a window count, a project type, and a quote range.

**Part 3: The Match.** After the full report is revealed, the `ContractorMatch` component offers to introduce the homeowner to a "WindowMan Verified Contractor" who can do the same job at fair-market pricing. The footer copy is explicit: *"WindowMan earns a referral fee only if you choose to work with a matched contractor."* This is the revenue model — a qualified lead marketplace where the product (the free scan) is the acquisition channel, the gate (OTP) is the qualification filter, and the match (contractor intro) is the monetization event.

### The User Psychology

The product is built around a specific emotional sequence that the codebase makes visible through its component ordering:

| Phase | Emotion | Component | Mechanism |
|---|---|---|---|
| 1. Landing | Suspicion + curiosity | `AuditHero`, `InteractiveDemoScan` | "The industry has no pricing transparency standard" — validates the user's existing distrust |
| 2. Configuration | Investment + commitment | `TruthGateFlow` (4 steps) | Micro-commitment ladder: window count → project type → county → quote range. Each answer makes the user more invested in seeing the result |
| 3. Lead capture | Reciprocity trigger | `TruthGateFlow` (name, email, phone) | The user has already "configured their scan" — asking for contact info feels like a fair exchange, not a cold gate |
| 4. Upload + scan | Anticipation + anxiety | `UploadZone`, `PostScanReportSwitcher` | 60-second AI analysis creates a "medical test results" tension |
| 5. Grade reveal | Relief or alarm | `GradeReveal` | The letter grade is the hook — emotionally charged, immediately shareable, but deliberately incomplete |
| 6. OTP gate | Friction-as-filter | `LockedOverlay`, `OtpUnlockModal` | Only genuinely concerned homeowners will verify their phone to see the details |
| 7. Full report | Empowerment + urgency | `TruthReportClassic` / `ReportShellV2` | Specific flags, dollar benchmarks, and an action plan create a "now I know what to do" feeling |
| 8. Contractor match | Resolution | `ContractorMatch` | The natural next step: "I found someone who will do this for less" |

This is not a SaaS product. It is a **lead generation funnel disguised as a consumer protection tool** — and that is not a criticism. The alignment is genuine: the homeowner gets real, actionable intelligence for free, and the business monetizes only when the homeowner voluntarily chooses to act on it. The incentives are structurally aligned.

---

## 2. Strategic Recommendations

### Recommendation 1: Close the "Full JSON" Security Gap

**Category:** Backend / Security
**Severity:** Critical
**Current state:** The `useReportAccess` hook contains this comment on line 5:

> SECURITY: This hook controls UI rendering only. The backend MUST independently gate full_json behind verification. This is a cosmetic toggle — not a security boundary.

This comment is accurate and alarming. Right now, `get_analysis_preview` is the only RPC called by `useAnalysisData`, and it returns data that the frontend then decides whether to blur or reveal based on client-side state. If the full analysis JSON is included in that response, any user with browser DevTools can extract the complete report without verifying their phone. The OTP gate becomes theater.

**Recommendation:** The backend must enforce the gate. The `get_analysis_preview` RPC should return only the grade, pillar scores, and flag count — never the flag details, action plan, or benchmarks. A second RPC, `get_analysis_full`, should exist and require a valid `phone_verified_at` timestamp on the `leads` row (set by the `verify-otp` Edge Function) before returning the complete payload. The frontend's `useReportAccess` hook should remain as a UX optimization (deciding what to render), but it should never be the security boundary.

This is the single most important change. Without it, the entire lead qualification model can be bypassed by a technically literate user, and worse, by a competitor scraping reports programmatically.

---

### Recommendation 2: Wire Real Data and Kill the Fixture Fallback in Production

**Category:** Frontend Architecture / Data Integrity
**Severity:** High
**Current state:** Both `Report.tsx` and `ReportClassic.tsx` contain TODO blocks where the real Supabase data fetch should be, with a fallback to `getFixture("grade_d", resolvedMode)`. The `findings-transform.ts` bridge (which converts V1 extraction data into the V2 `ReportEnvelope` shape) exists but is commented out. The `PostScanReportSwitcher` does fetch real data via `useAnalysisData`, but the standalone `/report/:sessionId` and `/report/classic/:sessionId` routes do not.

This means that if a user bookmarks or shares a report URL, they will see a hardcoded Grade D fixture — not their actual scan results. This is a trust-destroying experience for a product whose entire value proposition is trust.

**Recommendation:** Prioritize wiring `useAnalysisData` into both smart containers (`Report.tsx` and `ReportClassic.tsx`), uncomment the `transformToV2` bridge, and add a clear visual indicator when fixture/demo data is being shown (the demo badge exists but the fixture fallback is silent). In production builds, the fixture fallback should either be removed entirely or gated behind `import.meta.env.DEV`.

---

### Recommendation 3: Instrument the Funnel with Structured Event Analytics

**Category:** CRO / Analytics
**Severity:** High
**Current state:** The codebase has an `event_logs` table in Supabase and a handful of insert calls (`scan_invoke_failed`, `otp_failed_upstream`), but the vast majority of conversion-critical events are logged to `console.log` with no persistence. The `ContractorMatch` component logs contractor intro requests to `console.log({ event: "wm_contractor_intro_requested" })`. The `GradeReveal` component logs CTA clicks to console. The `InteractiveDemoScan` has a `track()` function, but it is not consistently used across the funnel.

Without structured event data, you cannot answer the most important business questions: What percentage of users who start the 4-step configuration complete it? At which step do they drop off? What percentage of grade reveals convert to OTP verification? What percentage of verified users click the contractor intro? What is the conversion rate by county, by grade, by quote range?

**Recommendation:** Define a canonical event taxonomy and instrument every transition in the funnel. At minimum:

| Event | Trigger Point |
|---|---|
| `funnel_step_completed` | Each of the 4 TruthGateFlow steps |
| `lead_captured` | Name + email + phone submitted |
| `quote_uploaded` | File upload initiated |
| `scan_completed` | scan-quote Edge Function returns |
| `grade_revealed` | GradeReveal animation completes |
| `otp_sent` | send-otp Edge Function called |
| `otp_verified` | verify-otp returns "approved" |
| `report_unlocked` | Gate transitions to "unlocked" |
| `contractor_intro_requested` | ContractorMatch CTA clicked |
| `exit_intent_shown` | ExitIntentModal triggered |
| `recovery_bar_clicked` | StickyRecoveryBar CTA clicked |

Every event should include `session_id`, `lead_id` (if captured), `county`, `grade` (if known), and a `source` field indicating which CTA triggered the action. Persist these to the `event_logs` table, not to `console.log`. This data is the foundation for every CRO decision going forward.

---

### Recommendation 4: Reduce the Pre-Upload Friction (the 7-Field Wall)

**Category:** UX / Conversion Rate Optimization
**Severity:** Medium-High
**Current state:** Before a user can upload their quote, they must complete a 7-field funnel: 4 multiple-choice configuration steps (window count, project type, county, quote range) followed by 3 contact fields (first name, email, phone). This is a significant commitment before the user has received any value. The interactive demo scan (`InteractiveDemoScan`) partially addresses this by showing a fake scan animation, but the real scan requires the full funnel.

The risk is that users who are mildly curious — the largest segment of traffic — bounce before reaching the upload step. The 4 configuration steps are valuable for lead enrichment, but they are not necessary for the scan itself. The scan-quote Edge Function only needs the uploaded file; the county and window count are used for downstream benchmarking, not for the extraction.

**Recommendation:** Consider a two-phase approach: let the user upload their quote immediately (zero friction), show the grade for free, then ask for the configuration details and contact info as the gate to the detailed findings. This inverts the current flow from "invest first, then see value" to "see value first, then invest." The grade reveal becomes the hook that justifies the lead capture. The configuration steps can be positioned as "help us calibrate your benchmarks" — which is true and feels like a fair exchange after the user has already seen their grade.

This is a testable hypothesis. A/B test the current 7-field-first flow against an upload-first flow and measure the completion rate of the OTP gate (which is the true conversion event, since that is where the qualified lead is created).

---

### Recommendation 5: Build the "Report Vault" for Return Visits and Referrals

**Category:** Product / Retention / Virality
**Severity:** Medium
**Current state:** The `ContractorMatch` component mentions a "WindowMan Vault" — *"Your grade report is saved in your WindowMan Vault — come back to it whenever you're ready."* — but this vault does not exist in the codebase. There is no user account system, no saved reports page, and no way for a verified user to return to their report without the original URL. The `localStorage` persistence in `scanFunnel.tsx` has a 24-hour TTL, after which the session data is wiped.

This is a missed opportunity on two fronts. First, the impact window purchase cycle is long — often 2-6 weeks from first quote to signed contract. A homeowner who scans their quote today may not be ready to act for weeks. If they cannot easily return to their report, the product loses its grip on the decision process. Second, the most powerful acquisition channel for a trust-based product is word-of-mouth: "My neighbor used this thing and found out her contractor was overcharging by $4,000." Without a shareable, persistent report, that referral loop is broken.

**Recommendation:** Build a lightweight "vault" experience. After OTP verification, associate the report with the verified phone number. Allow return access via a simple SMS magic link ("Text REPORT to [number] to access your saved scan"). Add a "Share This Report" button that generates a unique, read-only URL with the grade visible and the details gated — so the recipient sees the hook and is motivated to scan their own quote. This creates a viral loop: scan → share → scan → share.

---

## 3. Summary: Priority Matrix

| # | Recommendation | Category | Effort | Impact | Priority |
|---|---|---|---|---|---|
| 1 | Close the full_json security gap | Backend | Medium | Critical | **P0** |
| 2 | Wire real data, kill fixture fallback | Frontend | Low-Medium | High | **P0** |
| 3 | Instrument funnel with structured events | Analytics | Medium | High | **P1** |
| 4 | Reduce pre-upload friction (upload-first flow) | CRO | Medium | High | **P1** |
| 5 | Build the Report Vault for return visits | Product | High | Medium-High | **P2** |

The first two are table stakes — they must be resolved before any real traffic hits the product. The third is the foundation for all future optimization. The fourth is the highest-leverage CRO experiment available. The fifth is the long-term retention and virality play.

---

## 4. What Is Already Excellent

This assessment would be incomplete without acknowledging what the codebase does well, because there is a lot:

**The separation of concerns is unusually clean for a project at this stage.** The "smart container / dumb shell" pattern — where `Report.tsx` owns all Twilio logic and `FindingsPageShell` is a pure UI orchestrator — is a textbook example of how to keep side effects out of the rendering layer. The `usePhonePipeline` hook encapsulates the entire OTP state machine (idle → sending → awaiting_code → verifying → verified/failed) without leaking Twilio details to any consumer.

**The scoring algorithm is deterministic and auditable.** The `scan-quote` Edge Function uses explicit, documented deduction rules (e.g., "items without DP rating: -25 per item, max -50") rather than opaque ML scores. This is the right call for a trust product — the grades must be explainable and reproducible.

**The funnel psychology is sophisticated.** The 4-step configuration ladder, the micro-commitment pattern, the "this was a demo — yours could be worse" CTA, the exit-intent modal, the sticky recovery bar — these are not generic growth hacks. They are tailored to the specific emotional journey of a homeowner who suspects they are being overcharged but is not yet sure enough to act.

**The dual-route architecture is forward-thinking.** Having both a Classic and V2 report route with a version toggle, sharing the same Twilio engine, is the right way to A/B test a major UI redesign without risking the existing conversion flow.

The foundation is strong. The recommendations above are about closing gaps and amplifying what already works — not about rethinking the approach.
