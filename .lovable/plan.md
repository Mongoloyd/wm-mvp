
Audit findings:

- `src/components/arbitrageengine.tsx:173-192` already contains the named exports:
  - `export type FunnelStep = ...`
  - `export const FUNNEL_STEPS: FunnelStep[] = [...]`
- `src/pages/About.tsx:11` imports them from `@/components/arbitrageengine`, and that import path is correct for the current file structure.
- `src/components/arbitrageengine.tsx:337-379` already has the corrected `handleClose` behavior:
  - in direct-entry mode, first close sets `setIsExitIntent(true)` and returns
  - completed flow redirects to `/#truth-gate-section`
  - unfinished direct-entry flow falls back to `closeToAboutContent()`
- `src/components/arbitrageengine.tsx:862-865` already has the corrected Upload CTA target:
  - `new URL("/#truth-gate-section", window.location.origin)`
- `src/components/arbitrageengine.tsx:976-988` already has the corrected exit-intent “No thanks, I’ll pay retail.” handler:
  - when `autoOpen` is true, it calls `closeToAboutContent()` and returns

What this means:

1. The current repo state does not match the stale pasted version you described.
2. I do not see the four code mismatches in the current codebase snapshot.
3. Based on the files I audited, `About.tsx` should be able to import `FunnelStep` and `FUNNEL_STEPS` from `@/components/arbitrageengine` without needing an import-path change.
4. If you are still seeing TS2614 locally, the likely cause is a stale editor/build cache or a different unsaved local copy of `src/components/arbitrageengine.tsx` than the one currently in the repo.

Recommended next step if you want an implementation pass after this audit:
- verify your local editor copy of `src/components/arbitrageengine.tsx` matches the repo lines above
- then restart the TypeScript/Vite process if the error persists
- only change code if your local file truly differs from this audited version
