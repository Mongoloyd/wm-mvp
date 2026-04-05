

# Plan: Corrected Needs-Review Contract Test

## Problem
The user's draft test imports `fetchNeedsReview` and `updateNeedsReviewEntry` which don't exist, mocks the wrong Supabase path, and uses a flat body shape instead of the real `{ action, payload }` nesting.

## Changes

### 1. Add convenience wrappers to `src/services/adminDataService.ts`
Add two new exported functions after the existing wrappers (after line 418):

```ts
export async function fetchNeedsReview(): Promise<any[]> {
  return invokeAdminData("fetch_needs_review");
}

export async function updateLeadManualEntry(params: {
  lead_id: string;
  manually_reviewed?: boolean;
  manual_entry_data?: Record<string, unknown>;
}): Promise<{ success: boolean }> {
  if (!params.lead_id) {
    throw { code: "validation_error", message: "lead_id is required", status: 400 } as AdminDataError;
  }
  return invokeAdminData("update_lead_manual_entry", params);
}
```

### 2. Create `src/services/__tests__/needs-review.test.ts`
Uses the same mock pattern as the existing `adminDataService.test.ts`:
- Mocks `@/integrations/supabase/client` (correct path)
- Mocks `supabase.auth.getSession` returning a valid session
- Asserts `{ body: { action, payload }, headers: { Authorization } }` shape
- Tests:
  - `fetchNeedsReview` calls with `action: "fetch_needs_review"` and empty payload
  - Response includes new fields (`email`, `review_reason`)
  - `updateLeadManualEntry` sends correct payload with `manually_reviewed: false`
  - `updateLeadManualEntry` throws when `lead_id` is missing

## Files touched
- `src/services/adminDataService.ts` — add 2 wrapper functions (~15 lines)
- `src/services/__tests__/needs-review.test.ts` — new file (~90 lines)

## No changes to
- Edge function, schema, RLS, or any frontend UI

