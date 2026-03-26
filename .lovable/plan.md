

# Preserve Repeat-Scan Diagnosis (No Code Changes)

## What happens now
Save the complete diagnosis to a memory file for post-demo revisit. Zero code changes.

## Memory file: `mem://features/repeat-scan-bug.md`

Contents will capture:
- **Root cause**: `isFullLoaded` in `useAnalysisData.ts` never resets when `scanSessionId` changes
- **Divergence point**: line 289 — `if (!scanSessionId || isFullLoaded) return` skips `fetchFull` on repeat scan
- **Secondary issue**: `triggerTruthGate` in `Index.tsx` doesn't clear `scanSessionId`
- **Fix (deferred)**: reset effect on `scanSessionId` change + clear `scanSessionId` in `triggerTruthGate`
- **Files to touch when ready**: `src/hooks/useAnalysisData.ts`, `src/pages/Index.tsx`

## Files changed

| File | Change |
|---|---|
| `mem://features/repeat-scan-bug.md` | New — frozen diagnosis for post-demo |

## Next direction
Return to the dark-to-light theme transition sprint (Phase 1 → 2 → 3) as previously discussed.

