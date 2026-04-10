

## Tighten Letter Spacing on Demo Heading

### File: `src/components/InteractiveDemoScan.tsx` (line 307)

Add `letterSpacing: "-0.02em"` to the existing inline style object:

```tsx
<h2 className="wm-title-section mb-1.5" style={{ fontSize: "clamp(28px, 4vw, 34px)", letterSpacing: "-0.02em" }}>
```

No other changes needed — text is already correct.

