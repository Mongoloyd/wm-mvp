

## Plan: Real Data Sandbox Bypass + Lead Dossier Panel

### Task 1: DEV Bypass for Real Data in `adminDataService.ts`

**Problem:** `invokeAdminData` requires a Supabase auth session to call the edge function. No session exists in the Lovable sandbox.

**Solution:** When `import.meta.env.DEV` is true, bypass the edge function entirely and query tables directly using `supabase.from(...)` with the anon key. The `leads` table already has an RLS policy allowing authenticated SELECT, but in DEV there's no auth session. Two options:

**Approach: Add temporary anon SELECT policies for admin tables in DEV queries, OR use the service role.**

Actually, the simplest secure approach: The `analyses` table has NO RLS policies at all (empty policies = default deny for anon, but service_role bypasses). The `leads` table only allows authenticated SELECT via scan_sessions join. So direct `supabase.from("leads")` with anon key will return nothing.

**Revised approach:** Add a new edge function action `fetch_leads_dev` that skips JWT validation and instead checks a `DEV_BYPASS_SECRET` (same pattern as `dev-report-unlock`). This keeps data access server-side and secure.

**Simpler revised approach:** Modify `invokeAdminData` so in DEV mode, it passes the `DEV_BYPASS_SECRET` as a header instead of a JWT. Then in `admin-data/index.ts`, add a dev bypass check: if the `X-Dev-Secret` header matches `DEV_BYPASS_SECRET` env var, skip JWT validation and proceed with supabaseAdmin. This reuses the existing edge function with all its logic intact.

**Final approach chosen:**
1. In `adminDataService.ts`: when `import.meta.env.DEV`, read `VITE_DEV_BYPASS_SECRET` from env and pass it as `X-Dev-Secret` header instead of requiring a session JWT.
2. In `admin-data/index.ts` (`validateAdminRequestWithRole` or inline): before JWT validation, check if `X-Dev-Secret` header matches `DEV_BYPASS_SECRET` env var. If so, grant super_admin access.

This is secure (secret is only in `.env` locally + Supabase secrets), and gives full real data access.

**Files changed:**
- `supabase/functions/_shared/adminAuth.ts` — add dev bypass check at the top of `validateAdminRequestWithRole`
- `src/services/adminDataService.ts` — in DEV mode, skip session check and pass dev secret header instead
- `supabase/functions/admin-data/index.ts` — no changes needed if adminAuth handles it

### Task 2: Lead Dossier Sheet in InternalCRMDesk

**What:** Add a "View" button to each row in the Power Dialer table. Clicking it opens a `Sheet` (side panel) with the complete lead dossier.

**Dossier sections:**
1. **Contact Info** — Name, Email, Phone (clickable tel:), County/State/Zip
2. **Project Specs** — Window Count, Project Type, Quote Range, Quote Amount
3. **Attribution** — utm_source, utm_medium, utm_campaign, gclid, fbclid, landing_page_url, initial_referrer
4. **Analysis Results** — Grade, Dollar Delta, flag text for red/amber flags (fetched from `analyses.flags` via a new edge function action `fetch_lead_analysis`)
5. **Activity Timeline** — Key timestamps: created_at, phone_verified_at, report_unlocked_at, last_call_intent timestamps, plus lead_events

**Data gaps to fill:**
- CRMLead type needs additional fields: `project_type`, `quote_range`, `utm_source`, `utm_medium`, `utm_campaign`, `gclid`, `fbclid`, `landing_page_url`, `initial_referrer`, `report_unlocked_at`, `intro_requested_at`
- Need a new edge function action `fetch_lead_analysis` that returns the analysis row (including `flags`, `dollar_delta`, `full_json`) for a given lead's `latest_analysis_id`
- The `toLeadCRM` mapper in AdminDashboard needs to pass these additional fields through

**Files changed:**
- `src/components/admin/types.ts` — extend CRMLead with attribution + project fields
- `src/components/AdminDashboard.tsx` — extend `toLeadCRM` mapper
- `src/components/admin/InternalCRMDesk.tsx` — add View button, Sheet with dossier, fetch analysis on open
- `supabase/functions/admin-data/index.ts` — add `fetch_lead_analysis` action
- `src/services/adminDataService.ts` — add action type + wrapper

### New Component: `LeadDossierSheet.tsx`

A new file `src/components/admin/LeadDossierSheet.tsx` containing the full dossier layout with 5 sections (Contact, Project, Attribution, Analysis, Timeline). Uses shadcn `Sheet` component for the slide-out panel.

---

### Files Changed Summary

| File | Change |
|---|---|
| `supabase/functions/_shared/adminAuth.ts` | Add dev secret bypass in `validateAdminRequestWithRole` |
| `src/services/adminDataService.ts` | DEV mode: skip JWT, pass dev secret header |
| `supabase/functions/admin-data/index.ts` | Add `fetch_lead_analysis` action |
| `src/components/admin/types.ts` | Extend CRMLead with attribution/project/timeline fields |
| `src/components/AdminDashboard.tsx` | Extend `toLeadCRM` to map new fields |
| `src/components/admin/LeadDossierSheet.tsx` | **New** — Full dossier side panel |
| `src/components/admin/InternalCRMDesk.tsx` | Add "View" button per row, open dossier sheet, fetch analysis data |

