

# P5a + Voice Call Log — Implementation Plan

## Overview

Two-phase delivery: (1) add `fetch_lead_voice_followups` action to the admin-data edge function + frontend service helper, then (2) render a Call History panel inside LeadDossierSheet.

---

## Phase 1: P5a — Backend (fetch_lead_voice_followups)

### File 1: `supabase/functions/admin-data/index.ts`

1. Add `"fetch_lead_voice_followups"` to the `ActionName` union (line 8-15)
2. Add entry in `ACTION_ROLES`: `fetch_lead_voice_followups: ["super_admin", "operator", "viewer"]`
3. Add new action handler after the existing `fetch_voice_followups` block (after line 99), with specific column SELECT (no `select('*')` — omits `payload_json` and `result_json`), filtered by `lead_id`, ordered by `created_at desc`

### File 2: `src/services/adminDataService.ts`

1. Add `"fetch_lead_voice_followups"` to `AdminAction` union type
2. Add payload type: `fetch_lead_voice_followups: { lead_id: string }`
3. Add `VoiceFollowup` interface (exported) with all 20 fields from the spec
4. Add convenience wrapper `fetchLeadVoiceFollowups(leadId: string): Promise<VoiceFollowup[]>` using `invokeAdminData`

No changes to existing `fetch_voice_followups` action.

---

## Phase 2: Voice Call Log — Frontend

### File: `src/components/admin/LeadDossierSheet.tsx`

1. Import `fetchLeadVoiceFollowups` and `VoiceFollowup` from adminDataService
2. Import additional Lucide icons: `PhoneCall`, `Calendar`, `CalendarCheck`, `RotateCcw`, `AlertCircle`
3. Add state: `callHistory`, `callHistoryLoading`, `callHistoryError`, `expandedTranscripts`
4. Add useEffect to fetch on `currentLead?.id` change
5. Add "Call History" section below Truth Engine Audit with:
   - Header with PhoneCall icon + count pill
   - Loading: 3 skeleton rows
   - Error: AlertCircle + retry button
   - Empty: Phone icon + "No calls logged yet."
   - Entries: scrollable container (max-h-[400px]) with per-entry cards containing:
     - Row 1: Type badge (Manual/AI Call), outcome badge (color-coded), duration, booking icons, timestamp
     - Row 2: 3-case transcript fallback (inline text → external link → "No transcript"), summary, audio player (`preload="none"`), retry button (only on voicemail/no_answer/failed)
6. Retry handler calls `invokeAdminData("trigger_voice_followup", ...)` then refetches

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/admin-data/index.ts` | +1 action type, +1 role entry, +1 handler (~20 lines) |
| `src/services/adminDataService.ts` | +1 union member, +1 payload type, +1 interface, +1 helper function |
| `src/components/admin/LeadDossierSheet.tsx` | +Call History section (~150 lines) |

No schema changes. No new edge functions. Existing `fetch_voice_followups` untouched.

