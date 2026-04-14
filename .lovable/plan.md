

## Fix: ArbitrageEngine close behavior and Upload CTA target

Fix 1 (exports) is already applied — `export type FunnelStep` and `export const FUNNEL_STEPS` exist at lines 173 and 188. Three fixes remain:

---

### Fix 2 — handleClose (lines 337-374)

Replace the direct-entry branch so X shows exit-intent first instead of immediately closing to About content.

**Line 341**: Change `closeToAboutContent()` to `setIsExitIntent(true)`.

Also add a missing `return` + `closeToAboutContent()` call in the non-completed auto-open fallback at the end of the function (after the `wasCompleted` redirect block).

Full replacement for lines 337-374:
```tsx
const handleClose = () => {
  const preCompletionStep =
    funnelStep !== "done" && !["secret_capture", "secret_success"].includes(funnelStep);

  if (autoOpen && !hasCompletedFunnel && preCompletionStep && !isExitIntent) {
    setIsExitIntent(true);
    return;
  }

  if (
    !hasCompletedFunnel &&
    !isExitIntent &&
    funnelStep !== "done" &&
    !["secret_capture", "secret_success"].includes(funnelStep) &&
    !isEmailValid
  ) {
    setIsExitIntent(true);
    return;
  }

  const wasCompleted = funnelStep === "done" || hasCompletedFunnel;
  setHasCompletedFunnel(true);
  setFlowState("revealed");

  setTimeout(() => {
    setFunnelStep("scope");
    setStepHistory([]);
    setIsExitIntent(false);

    if (wasCompleted) {
      toast.success("You're matched! Let's scan your quote.");
      setTimeout(() => {
        const safeUrl = new URL("/#truth-gate-section", window.location.origin);
        window.location.assign(safeUrl.toString());
      }, 1200);
      return;
    }

    if (autoOpen) {
      closeToAboutContent();
    }
  }, 300);
};
```

### Fix 3 — "No thanks" button handler (lines 970-979)

Add an `autoOpen` check so direct-entry users close to About content instead of just resetting state.

Replace lines 971-978:
```tsx
onClick={() => {
  if (autoOpen) {
    closeToAboutContent();
    return;
  }
  setFlowState("revealed");
  setHasCompletedFunnel(true);
  setTimeout(() => {
    setFunnelStep("scope");
    setStepHistory([]);
    setIsExitIntent(false);
  }, 300);
}}
```

### Fix 4 — Upload CTA target (line 859)

Change `"/"` to `"/#truth-gate-section"` so the button goes to TruthGate.

```tsx
const safeUrl = new URL("/#truth-gate-section", window.location.origin);
```

---

### Summary
One file changed (`src/components/arbitrageengine.tsx`), three edits. No changes to About.tsx. The export issue is already resolved.

