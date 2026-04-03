

# Add Second SocialProofStrip Below TruthGateFlow Questions

## Summary
Place a second instance of `SocialProofStrip` approximately 150px below the `UploadZone` (which sits right after the TruthGateFlow question cards), matching the reference screenshot layout.

## Changes

### `src/pages/Index.tsx`
- Add a second `<SocialProofStrip />` immediately after the `<UploadZone />` component, wrapped in a `<div className="mt-[150px]">` spacer to create the ~150px gap
- The existing `SocialProofStrip` import is already present, so no new imports needed

```text
Before:
  <UploadZone ... />
</>

After:
  <UploadZone ... />
  <div className="mt-[150px]">
    <SocialProofStrip />
  </div>
</>
```

## Files changed
- `src/pages/Index.tsx` — add second SocialProofStrip instance with 150px top margin after UploadZone

