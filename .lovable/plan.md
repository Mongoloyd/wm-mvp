

# Assessment and Plan

## The Current Error: Not a Code Bug

The runtime error `Failed to fetch dynamically imported module: AdminDashboard.tsx` is a **Vite HMR cache invalidation issue**, not a missing import. Evidence:
- `npx tsc --noEmit` passes with zero errors
- All 4 admin components exist with correct named exports
- The lazy import in `App.tsx` correctly references `./components/AdminDashboard.tsx`
- Dev server logs show successful HMR updates, no compilation errors

**Fix**: Force a full page reload (not HMR). The simplest way is to add a trivial whitespace change to `App.tsx` or restart the dev server. However, there IS one real problem: `AdminDashboard.test.tsx` still tests the OLD dashboard (references `useCurrentUserRole`, "OPERATOR COMMAND CENTER", "Access Control" link). This will cause test failures and should be rewritten.

## Rating Your 3 Prompts: 72/100

### What scores well (the good parts):
1. **Realtime notifications via Supabase Realtime** — correct technology choice for this stack. Supabase Realtime subscriptions on `webhook_deliveries` are the right way to get push updates without polling.
2. **Toast-to-action pattern** (click toast -> switch tab -> open sheet) — excellent UX. This is exactly how high-velocity CRMs should work.
3. **Sound cue for hot leads** — smart for a single-operator setup where you might have the dashboard in a background tab.

### What costs you 28 points:

**1. Premature complexity before data validation (-10 points)**
You have zero confirmed leads flowing through the system yet. Building a realtime notification system before verifying that `fetch_leads` returns actual data from the Edge Function is building a roof before checking if the foundation is level. Your FIRST prompt should be: "Navigate to /admin, confirm the dashboard loads, and show me what the Command Center displays with real data."

**2. The test file is a ticking bomb (-8 points)**
`AdminDashboard.test.tsx` still tests the OLD dashboard. It imports `useCurrentUserRole` and checks for "OPERATOR COMMAND CENTER" — none of which exist anymore. This will block CI and confuse future debugging. None of your 3 prompts address this.

**3. Missing the "Assigned Partner" dropdown (-5 points)**
Your own blueprint says the architecture must be flexible for multiple clients. But none of your prompts add the "Assigned To" dropdown on the pipeline. This is the single cheapest future-proofing move and should be built while the pipeline table is fresh.

**4. No lead-detail data validation (-5 points)**
The LeadProfileSheet fetches `lead_events` via `fetchLeadEvents(leadId)`. You have no prompt to verify this Edge Function action actually returns data. If the `lead_events` table is empty (likely), the timeline will be blank and you won't know if it's a bug or just no data.

## What I Would Build Instead (Revised Prompt Sequence)

### Prompt 1: Fix and Validate (Priority: Critical)
"Fix the AdminDashboard runtime error. Delete or rewrite `AdminDashboard.test.tsx` to match the new 4-tab Lead Sniper CRM structure. Then navigate to /admin and confirm the dashboard loads with real data from the Edge Function. Show me what the Command Center KPIs display."

### Prompt 2: Realtime Hot Lead Alerts (Your prompt, refined)
"Add Supabase Realtime subscription to the AdminDashboard shell. Subscribe to INSERT events on the `webhook_deliveries` table filtered to `event_type = 'qualified_lead'`. When a new row arrives:
- Play a short notification sound (use the Web Audio API to generate a tone — no external audio files)
- Fire a sonner toast: 'NEW HOT LEAD: [first_name] just verified!' with an action button
- Clicking the toast should: set the active tab to 'pipeline', find the matching lead by `lead_id`, and open their LeadProfileSheet
- Also bump the KPI cards immediately without waiting for the 30s poll cycle

Important: The Realtime subscription needs the Supabase client to be authenticated as an operator, so gate it behind the same auth check."

### Prompt 3: Ghost Recovery Actions + Pipeline Sort
"Add two features:
1. On the Ghost Recovery tab, add a 'Send Recovery Email' button per row that calls the existing `lead-reactivation` Edge Function. Show a success/error toast after the call. Disable the button if `reactivation_email_sent_at` is already set on the lead.
2. On the Active Pipeline tab, add a sort toggle: 'Newest First' (default) vs 'Hottest First' (sort by lead_score DESC, then grade_score DESC). Add a search/filter input that filters by name, email, or phone."

### Prompt 4: The "Assigned Partner" Future-Proofing
"Add an 'Assigned To' column to the Active Pipeline table. For now it displays 'Primary Client' as a static badge. Add a dropdown (shadcn Select) that is currently disabled with a tooltip: 'Multi-client routing coming soon'. This ensures the column exists in the UI and the data model without building the full routing logic."

## Step-by-Step Fix Plan (Immediate)

### Step 1: Force clean rebuild
Add a trivial comment to `App.tsx` to bust the Vite module cache and force a fresh dynamic import of `AdminDashboard.tsx`.

### Step 2: Rewrite `AdminDashboard.test.tsx`
Replace the old test suite with tests that match the new 4-tab structure:
- Test that AuthGuard wraps the content
- Test that all 4 tab triggers render (Command Center, Active Pipeline, Ghost Recovery, Engine Room)
- Test that the header shows "Lead Sniper CRM"
- Mock `invokeAdminData` and `fetchWebhookDeliveries` to return empty arrays
- Remove all references to `useCurrentUserRole`, "OPERATOR COMMAND CENTER", "Access Control"

### Step 3: Verify on preview
Navigate to `/admin` and confirm the dashboard renders without errors.

