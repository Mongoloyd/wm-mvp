

# Plan: Surface P7a Backend Fields in Existing NeedsReviewTab

## Context
The P7 prompt is redundant — `NeedsReviewTab.tsx` and its dashboard wiring already exist. The real gap is that the P7a backend deltas added `email`, `phone_e164`, and `manually_reviewed` to the `fetch_needs_review` response, but the frontend type and UI don't use them yet.

## Changes

### 1. Update `NeedsReviewLead` type in `src/components/admin/NeedsReviewTab.tsx`
Add three fields to the interface (lines 22-38):
```
email: string | null;
phone_e164: string | null;
manually_reviewed: boolean;
```

### 2. Show contact info in the Lead column
In the table row (around line 198-206), add email and phone below the name/date:
- Display `phone_e164` formatted via existing `formatPhone` util
- Display `email` as a secondary line
- Keep it compact (text-xs, muted color, truncated)

### 3. Add "Mark Reviewed" toggle
Currently the only way to mark reviewed is through the Manual Entry sheet (which also saves form data). Add a lightweight standalone "Mark Reviewed" button that calls `updateLeadManualEntry({ lead_id, manually_reviewed: true })` directly — for cases where the operator just wants to dismiss a lead without entering data.

Place it in the Actions column alongside Re-Scan and Manual Entry.

### 4. No other files changed
- No backend changes
- No dashboard wiring changes (tab already exists)
- No schema changes

## Files Modified
- `src/components/admin/NeedsReviewTab.tsx` — type update + 2 UI additions (~20 lines net)

