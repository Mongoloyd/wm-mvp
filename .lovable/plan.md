

## Contractor Routing Onboarding — Implementation Plan

### Problem
When a contractor is "approved" in the QualificationFlow modal, the CTA button ("Set Routing Preferences") just closes the modal. There is no next step, no onboarding page, and no follow-up communication. The contractor is left hanging.

### What We Will Build

**1. Database: Add routing columns to `contractors` table**

The `contractors` table already has `service_counties`, `service_regions`, `project_types`, `min_window_count`, `max_window_count`. We will add:

- `preferred_contact_method` (text, nullable) — 'call', 'text', 'email'
- `schedule_notes` (text, nullable) — free-text for schedule preferences
- `max_leads_per_week` (integer, nullable) — capacity cap
- `budget_bands` (text[], default '{}') — e.g. 'under_15k', '15k_30k', '30k_plus'
- `routing_setup_completed_at` (timestamptz, nullable) — marks onboarding as done

No new table needed. The `contractors` table is the right place since it already holds all routing/matching fields and is operator-gated (service-role writes).

**2. New page: `/partner/onboarding`**

A simple, branded form page (wrapped in `PartnerGuard`) collecting:

- Service areas (Florida county multi-select — matching the existing `service_counties` field)
- Lead types: project types (repair, replacement, retrofit, etc.) + budget bands
- Contact preference (call / text / email radio)
- Schedule notes (free text)
- Max leads per week (dropdown: 1-5, 6-10, 11-20, unlimited)

Primary CTA: "Save & Start Receiving Leads"

On submit, calls a new edge function `save-routing-preferences` that:
- Resolves the contractor via `auth.getUser()` → `contractors.auth_user_id`
- Updates the `contractors` row with all routing fields + sets `routing_setup_completed_at = now()`
- Returns success

**3. Wire the modal CTA**

In `QualificationFlow.tsx` line 529, change:
```
<CTAButton onClick={onClose}>Set Routing Preferences</CTAButton>
```
to accept a `navigate` call. Since `QualificationFlow` is a modal inside `/contractors`, we will use `useNavigate` and route to `/partner/onboarding` on click.

**4. Edge function: `save-routing-preferences`**

- Validates JWT via `supabase.auth.getUser()`
- Looks up `contractors` row where `auth_user_id = user.id`
- Updates routing fields
- Sets `routing_setup_completed_at = now()`
- Returns `{ success: true }`

**5. Stub for follow-up email**

Create a clearly named placeholder function `notifyContractorApproved()` in the onboarding page or a utility file. This will log the intent and can be wired to the email provider later. The function signature and comment will make it obvious what to connect.

**6. Admin visibility: "Needs Routing Setup" filter**

In `ContractorAccountsTab.tsx`, add a small badge on contractor rows where `routing_setup_completed_at IS NULL`. The `list_contractor_accounts` admin-data handler will be extended to include this field from a join to `contractors`.

### Files Modified
- `QualificationFlow.tsx` — add `useNavigate`, wire CTA to `/partner/onboarding`
- `src/App.tsx` — add route `/partner/onboarding`
- New: `src/pages/ContractorOnboarding.tsx` — the routing setup form
- New: `supabase/functions/save-routing-preferences/index.ts` — persist routing data
- Migration: add 5 columns to `contractors`
- `supabase/functions/admin-data/index.ts` — include `routing_setup_completed_at` in contractor list query
- `ContractorAccountsTab.tsx` — show "Needs Setup" badge

### What We Will NOT Build
- Full email sending (stub only — no Resend/transactional wiring yet)
- SMS reminders (noted as future)
- Automated 24-48h follow-up cron

