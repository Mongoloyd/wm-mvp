

# WindowMan Master Roadmap — Status Recap

## PHASE 1: CORE INFRASTRUCTURE — Status: ✅ COMPLETE

| Prompt | Goal | Status | Evidence |
|--------|------|--------|----------|
| **1 — /lp/[slug] Routes + Default Pixel Seed** | White-label slug routing, clientSlug stamping | ✅ Done | `LandingPage.tsx` validates against `clients` table, threads slug into `ScanFunnelProvider`. `meta_configurations` table with 3-tier fallback seeded. |
| **2 — Browser-Side Pixel & Attribution** | Global Meta Pixel, `_fbp`/`_fbc` capture, UTM persistence | ✅ Done | `metaPixel.ts`, `shadowPixel.ts`, `useUtmCapture.ts`, `useLeadId.ts` all wired in `main.tsx`. |
| **3 — E2E Test Mode + CAPI Verification** | Fire mock CAPI payloads with `META_TEST_EVENT_CODE` | ✅ Done | `capi-event` edge function supports `test_event_code` from DB or env. `verify-capi-fallback.ts` script validates DB-priority → env-fallback. `capi_signal_logs` table records every signal. |
| **4 — Partner Admin Dashboard** | Onboard clients, assign pixels, view signal logs | ✅ Done | `AdminPartners.tsx`, `AdminDashboard.tsx` with multiple tabs (Pipeline, Ghost Recovery, Attribution, Contractor Accounts, etc.). |
| **5 — DB Migration & Hardening** | Schema finalization, RLS, edge function hardening | ✅ Done | 70+ migrations. RLS on all tables. `is_internal_operator()` function gates admin access. Edge functions use service role. |

## PHASE 2: THE INTELLIGENCE LAYER — Status: ✅ COMPLETE

| Prompt | Goal | Status | Evidence |
|--------|------|--------|----------|
| **6 — The Vault (Secure Document Storage)** | Private bucket, upload locked to `lead_id` | ✅ Done | `quotes` private bucket, signed URL access only, `UploadZone.tsx`, `quote_files` table with RLS. |
| **7 — Lead Quality Scoring & AI Truth Report** | Gemini OCR → deterministic TypeScript scoring | ✅ Done | `scan-quote` edge function (extraction → `scoring.ts` → `flagging.ts` → `reportCompiler.ts`). 5-pillar rubric, A-F grading, county benchmarks. |
| **8 — Client Portal (Proof of Work)** | Authenticated contractor dashboard with leads + Truth Reports | ✅ Done | `ContractorOpportunitiesPage.tsx`, `PartnerDossier.tsx` with document vault, intelligence dossier, lead status management. Credit-based unlock system. |

## PHASE 3: SCALE & REVENUE — Status: ⚠️ PARTIAL

| Prompt | Goal | Status | Evidence |
|--------|------|--------|----------|
| **9 — Billing & Subscription (Stripe)** | Stripe Checkout, webhook fulfillment, `is_active` kill-switch | ⚠️ Partial | `create-checkout-session` and `stripe-webhook` edge functions exist. Credit purchase tiers work. **Missing:** automatic `is_active` toggle on payment failure; no recurring subscription model yet — current model is credit-pack purchases only. |
| **10 — Multi-Territory (Hub & Spoke)** | `client_routes` table, 1-to-Many slug→pixel mapping | ❌ Not Started | No `client_routes` table. Current model is 1 client = 1 slug = 1 pixel via `clients` + `meta_configurations`. |
| **11 — Reclamation Engine** | "Lost" lead → re-offer to Client B, automated second-opinion email | ❌ Not Started | No reclamation logic, no "Second Opinion" email flow, no lead reassignment UI. |

---

## WHAT I WOULD ADD (Gaps & Recommendations)

### Missing from the roadmap that already exists in your codebase
These are significant capabilities you've built that the roadmap doesn't mention — worth documenting:

1. **OTP Hard Gate (SMS Verification)** — Full Twilio Verify flow (`send-otp`, `verify-otp`), phone_verifications table, report access gating. This is a core moat piece.
2. **Contractor Monetization Layer** — Credit system, `contractor_credits`, `contractor_credit_purchases`, `billable_intros`, `contractor_outcomes`. Far more sophisticated than the roadmap's simple "Stripe subscription."
3. **Contractor Onboarding & Invite System** — `accept-invite`, partner auth, password reset flow.
4. **Voice Follow-up Pipeline** — `voice-followup` and `request-callback` edge functions.
5. **Canonical Event Tracking Architecture** — 4-layer vendor-agnostic tracking system with anomaly detection, trust scoring, and platform mappers.
6. **Contractor Brief Generation** — AI-generated anonymized briefs with match scoring.

### Genuinely missing pieces to complete the vision

1. **Reclamation Engine (Prompt 11)** — No lead reassignment or "Second Opinion" email automation exists.
2. **Hub & Spoke Multi-Territory (Prompt 10)** — No `client_routes` table for 1-to-Many slug mapping.
3. **Subscription billing with auto-deactivation** — Current model is one-time credit packs. No recurring billing or automatic `is_active = false` on failed payment.
4. **`/admin/test-signal` UI** — The E2E test script exists but there's no in-app admin tool to fire mock CAPI payloads interactively.
5. **No Polling guardrail** — The roadmap mandates Supabase Realtime WebSocket subscriptions. Some admin views may still use polling (`useEffect` + `setInterval`) rather than Realtime channels.

### Summary
Phases 1 and 2 are fully delivered. Phase 3 is roughly 40% complete — billing exists but as credits, not subscriptions, and the two most advanced features (Hub & Spoke + Reclamation Engine) haven't been started.

