

## Internal CRM Desk — Power Dialer Plan

### What We're Building
A "Power Dialer" tab replacing the Engine Room in the admin dashboard. It shows only phone-verified leads with their analysis grade, red flag count, and voice followup status — optimized for speed-to-lead calling.

### Architecture Decision
**No new edge function action needed.** The existing `fetch_leads` action already returns all leads (including `phone_verified`, `grade`, `red_flag_count`, `funnel_stage`, `deal_status`). The existing `update_lead_status` action can update `leads.status`. We just need to also update `leads.deal_status` — which the edge function already writes to `leads` via a generic update. We'll add a new `update_lead_deal_status` action to the edge function for this specific column.

### Task 1: Edge Function Update — `admin-data/index.ts`

Add a new action `update_lead_deal_status` (operator+) that updates `leads.deal_status` for a given lead ID. The `deal_status` column already exists on the `leads` table.

Also add `update_lead_funnel_stage` to update `leads.funnel_stage`.

### Task 2: Frontend Service Update — `adminDataService.ts`

Add the new action types and convenience wrappers.

### Task 3: Create `InternalCRMDesk.tsx`

New file: `src/components/admin/InternalCRMDesk.tsx`

**Data:** Filter `leads` array where `phone_verified === true`. For each lead, the grade/red_flag_count/deal_status are already on the CRMLead object (synced in Phase 1). Voice followup intent comes from `leads.last_call_intent`.

**Summary strip (3 cards):**
- Total Verified Leads
- Needs First Call (deal_status is null or 'new')
- Appointments Booked (deal_status === 'appointment_booked')

**Table columns:**
- Date (created_at, formatted)
- Name (first_name + last_name)
- Phone (clickable `tel:` link, full number visible to operators)
- County
- Grade (color-coded badge)
- Red Flags (count)
- Call Intent (from last_call_intent — shows "Requested" badge if present)
- Status (dropdown: New, Attempted, In-Conversation, Appointment Booked, Dead)

**Sort:** Most recent first by default. Leads with `deal_status` null/new float to top.

**Status dropdown:** On change, calls `update_lead_deal_status` via the edge function, then shows a toast.

### Task 4: Admin Dashboard Integration — `AdminDashboard.tsx`

- Replace Engine Room tab label "Engine Room" with "Dialer Desk"
- Replace `<EngineRoom>` with `<InternalCRMDesk>`
- Pass `leads` and a `handleDealStatusUpdate` callback
- Keep EngineRoom.tsx file (not deleted, just unused for now)

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/admin-data/index.ts` | Add `update_lead_deal_status` action |
| `src/services/adminDataService.ts` | Add action type + wrapper |
| `src/components/admin/InternalCRMDesk.tsx` | **New** — Power Dialer component |
| `src/components/AdminDashboard.tsx` | Swap Engine Room for InternalCRMDesk, rename tab |

### No Migration Needed
The `leads.deal_status` column already exists. The edge function uses `supabaseAdmin` (service role) so no RLS changes are needed for the update.

