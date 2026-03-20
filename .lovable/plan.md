

# Fix Build Errors + Wire Provider, Toggle, and Switcher

## Problems

1. **Case mismatch**: File is `src/state/AnalysisViewMode.tsx` but imports use `analysisViewMode` (lowercase). Fix: rename file to `analysisViewMode.tsx`.
2. **Missing module**: `PostScanReportSwitcher` imports from `../TruthReport/TruthReport` but the file is `src/components/TruthReport.tsx` (not in a subfolder, and it's a default export). Fix: update import path.
3. **Type error**: `toggleMode` calls `setMode` with a function updater, but `setMode` expects `AnalysisViewMode`. Fix: use `setModeState` directly in `toggleMode`.
4. **Provider not mounted**: `AnalysisViewModeProvider` isn't in the component tree yet.
5. **Toggle not in DevPreviewPanel**: `AnalysisViewModeToggle` not rendered.
6. **Switcher not used**: `PostScanReportSwitcher` not wired in anywhere yet (deferred — need to find where TruthReport is rendered in the post-scan flow).

## Changes

### 1. Rename `src/state/AnalysisViewMode.tsx` → `src/state/analysisViewMode.tsx`
Recreate with same content but fix the `toggleMode` type error:

```ts
const toggleMode = useCallback(() => {
  setModeState((prev) => (prev === "v1" ? "v2" : "v1"));
}, []);
```

### 2. Fix `PostScanReportSwitcher.tsx` imports
- Change `../TruthReport/TruthReport` → `../TruthReport`
- Use default import: `import TruthReport from "../TruthReport"`
- Render as `<TruthReport analysis={analysis} />`

### 3. Wrap App in `AnalysisViewModeProvider` in `src/main.tsx`

### 4. Add `AnalysisViewModeToggle` to `DevPreviewPanel`
Import and render inside the panel, near the existing rubric stats button area.

### Files touched

| File | Change |
|------|--------|
| `src/state/analysisViewMode.tsx` | Recreate (rename + fix toggleMode) |
| `src/state/AnalysisViewMode.tsx` | Delete (replaced by lowercase version) |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | Fix TruthReport import path |
| `src/main.tsx` | Wrap with `AnalysisViewModeProvider` |
| `src/dev/DevPreviewPanel.tsx` | Add `AnalysisViewModeToggle` |

