

## Contractor Funnel — Gap Analysis & Fix Plan

### Current State (Verified)

**Working:**
- Database: All 3 tables (`contractor_leads`, `contractor_activity_log`, `contractor_followups`) exist with RLS and triggers
- Types: `src/types/contractorLead.ts` matches the schema
- Service layer: `src/lib/contractors2/service.ts` has full CRUD (572 lines, clean build)
- Edge function code: All 3 functions exist in the repo
- Frontend: `/contractors2` route renders `QualificationFlow` with 6-step wizard
- Build: Zero TypeScript errors

**Broken / Missing:**

### Gap 1 — QualificationFlow Never Persists Leads (Critical)

`QualificationFlow.tsx` computes a routing tier locally but **never calls `createContractorLead`**. On Step 6:
- HIGH/MID tier: Shows Calendly embed — no lead record created
- LOW tier: Captures email with `console.log({ type: "low_tier", email })` — data is thrown away
- BLOCK tier: Renders nothing

**Fix:** After the tier is computed (Step 4 → Step 5 transition), call `createContractorLead()` with the qualification answers and email. For LOW tier, also persist the email on submit. Map the qualification `Answers` keys to the `contractor_leads` column names.

### Gap 2 — No Booking Confirmation Route

When a contractor finishes Calendly and gets redirected back, there's no route to call `contractor-booking-confirmed`. The Calendly embed fires on the client side but nothing updates the CRM.

**Fix:** Add a `/contractors2/confirmed` route (or handle Calendly's `calendly.event_scheduled` postMessage in the existing `CalendlyEmbed` component) to call the edge function with the `lead_id` and Calendly URIs.

### Gap 3 — Edge Functions May Not Be Deployed

The code exists but we need to verify deployment.

**Fix:** Deploy all 3 edge functions: `contractor-booking-confirmed`, `contractor-send-followups`, `contractor-mark-no-show`. Also verify the `CONTRACTOR_CRON_SECRET` secret exists (it's not listed in the current secrets).

### Gap 4 — No Admin View for Contractor Leads

No `/admin/contractors2` page exists. The service layer's `listContractorLeads` function is unused.

**Fix:** Create a simple admin tab or page that lists contractor leads with pipeline stage, booking status, and notes. This is lower priority — defer to a follow-up sprint.

---

### Implementation Plan (Ordered by Impact)

**Step 1: Wire QualificationFlow to the service layer**
- Import `createContractorLead` into `QualificationFlow.tsx`
- After `computeRoutingTier()` returns, call `createContractorLead()` with mapped answers
- Store the returned `lead_id` in component state for the Calendly step
- For LOW tier email submit: call `createContractorLead()` with just the email
- Add error handling with toast feedback

**Step 2: Handle Calendly booking confirmation**
- Listen for Calendly's `message` event (`calendly.event_scheduled`) in the `CalendlyEmbed` component
- When received, invoke `contractor-booking-confirmed` edge function with `lead_id` + Calendly URIs
- Show a success state to the contractor

**Step 3: Add missing secret + deploy edge functions**
- Add `CONTRACTOR_CRON_SECRET` to Supabase secrets
- Deploy `contractor-booking-confirmed`, `contractor-send-followups`, `contractor-mark-no-show`

**Step 4 (Deferred): Admin contractor leads view**
- Add a tab in AdminDashboard or a standalone page at `/admin/contractors2`

### Files Modified
1. `src/components/qualification/QualificationFlow.tsx` — add lead persistence + Calendly event handling
2. `src/components/ui/CalendlyEmbed.tsx` — add `onEventScheduled` callback prop
3. Supabase secrets — add `CONTRACTOR_CRON_SECRET`
4. Deploy 3 edge functions

