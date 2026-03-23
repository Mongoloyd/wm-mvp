

# Fix: scan-quote SupabaseClient Type Mismatch

## What
Three line changes in `supabase/functions/scan-quote/index.ts` to resolve all 14 build errors.

## Changes

**File: `supabase/functions/scan-quote/index.ts`**

1. **Line ~8 (import):** Add `SupabaseClient` to the existing import:
   ```typescript
   import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
   ```

2. **Line ~378 (`updateScanSessionStatus` signature):** Change parameter type:
   ```typescript
   supabase: SupabaseClient,
   ```

3. **Line ~423 (`upsertAnalysisRecord` signature):** Same change:
   ```typescript
   supabase: SupabaseClient,
   ```

No other files affected. This resolves the `"public"` vs `never` schema mismatch on all `.from()` calls.

