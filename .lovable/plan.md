

# Micro-Fix + P6a + P6 — Implementation Plan

## Three deliverables in sequence

1. **Micro-fix**: Retry null guard in LeadDossierSheet
2. **P6a**: send-contractor-handoff Edge Function
3. **P6**: Contractor Handoff Button in LeadDossierSheet

---

## 1. Micro-Fix — Retry null guard

**File**: `src/components/admin/LeadDossierSheet.tsx` (line 176-187)

Replace the `handleRetryCall` function to exit early when no `scan_session_id` is available, instead of passing an empty string. Add a `toast.error()` for operator feedback.

---

## 2. P6a — send-contractor-handoff Edge Function

### Schema constraint issue (CRITICAL)

The `contractor_opportunities` table has:
- `scan_session_id uuid NOT NULL` — required
- `analysis_id uuid NOT NULL` — required
- `status` CHECK constraint allows: `intro_requested`, `brief_generating`, `brief_ready`, `queued`, `assigned_internal`, `sent_to_contractor`, `viewed_by_contractor`, `contractor_interested`, `contractor_declined`, `homeowner_contact_released`, `intro_completed`, `closed_won`, `closed_lost`, `dead`

The spec says `status: 'sent'` — this value is NOT in the CHECK constraint. We must use `'sent_to_contractor'` instead. Also, inserts require `scan_session_id` and `analysis_id` from the lead.

### File: `supabase/functions/send-contractor-handoff/index.ts`

New Edge Function following the exact `dial-lead` pattern:
- Auth via `validateAdminRequestWithRole(req, ["super_admin", "operator"])`
- Input: `{ lead_id }`
- Step 1: Fetch lead (including `latest_scan_session_id`, `latest_analysis_id`)
- Step 2: Fetch analysis `full_json` for pillar scores and flags
- Step 3: Upsert `contractor_opportunities` using `status: 'sent_to_contractor'` (valid CHECK value), with required `scan_session_id` and `analysis_id`
- Step 4: Send email via Resend API (direct, matching existing `send-report-email` pattern — no connector gateway since RESEND_API_KEY is already a direct secret)
- Step 5: Return with partial success shape (DB ok + email fail = 200 with warning)

### File: `supabase/config.toml`

Add: `[functions.send-contractor-handoff]` with `verify_jwt = false`

### Secrets needed

- `RESEND_API_KEY` — already exists
- `CONTRACTOR_EMAIL` — needs to be added (recipient address)
- `CONTRACTOR_NAME` — needs to be added (display name)

### File: `src/services/adminDataService.ts`

No changes needed — the handoff button will call the edge function directly (like `dialLead`), not through `admin-data`. Add a `sendContractorHandoff(leadId)` helper that follows the same dev-bypass + session JWT pattern as `dialLead`.

---

## 3. P6 — Contractor Handoff Button

### File: `src/components/admin/LeadDossierSheet.tsx`

Add to the sheet header area (alongside the grade badge):

1. **State**: `handoffSending`, `handoffModalOpen`, `handoffSent` (derived from `lead.latest_opportunity_id`)
2. **Button**: "Send to Contractor" (amber) or "Sent to Contractor" (green, disabled) based on `latest_opportunity_id`
3. **Confirmation Dialog**: Shows homeowner name, city, grade badge, flag count, top 3 HIGH-severity flags from existing `analysisData`
4. **On confirm**: Call `sendContractorHandoff(lead.id)`, handle success/partial/failure with appropriate toasts
5. **Optimistic update**: Set local `sentToContractor` flag to disable button immediately after success

Import Dialog components from `@/components/ui/dialog`. Add `Send` icon from lucide-react.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/admin/LeadDossierSheet.tsx` | Retry null guard + handoff button + confirmation dialog |
| `supabase/functions/send-contractor-handoff/index.ts` | New edge function |
| `supabase/config.toml` | Add verify_jwt config |
| `src/services/adminDataService.ts` | Add `sendContractorHandoff()` helper |

## Secrets to request

- `CONTRACTOR_EMAIL` — recipient email for handoff reports
- `CONTRACTOR_NAME` — contractor display name

## Key corrections from spec

- Use `'sent_to_contractor'` not `'sent'` (CHECK constraint)
- Include `scan_session_id` and `analysis_id` in insert (NOT NULL columns)
- Use Resend directly (not connector gateway) — matches existing pattern
- Guard against leads without `latest_scan_session_id` or `latest_analysis_id`

