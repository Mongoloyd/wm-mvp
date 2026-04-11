

## Plan: Add Mobile FAB "Start Scan" to Forensic Shift Document

### What
Add a floating action button (bright cyan circle with "Start Scan" text) positioned at the top-right corner of the paper/analog document view. Visible only on viewports below `lg` (1024px). Clicking it opens the analysis modal (`setShowModal(true)`).

### File Modified
`src/components/Forensicshift.jsx`

### Changes

**1. Add FAB inside the paper-side document container (line ~253-256 area)**

Inside the left-half (paper view) container, after the `<DocumentContent isDigital={false} .../>`, add a button:

```jsx
{/* Mobile FAB - visible below lg only */}
<button
  onClick={() => setShowModal(true)}
  className="lg:hidden absolute top-3 right-3 z-20 w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex flex-col items-center justify-center transition-colors"
>
  <span className="text-[9px] font-black uppercase leading-tight text-white tracking-wide">Start</span>
  <span className="text-[9px] font-black uppercase leading-tight text-white tracking-wide">Scan</span>
</button>
```

**Challenge**: The paper-side container currently has `overflow-hidden` on its parent. The FAB needs to sit inside a `relative` wrapper that is within the visible clipping area, so it won't be cut off. The button will be placed inside the existing paper-half `div` (line 253) which already clips to `w-1/2`, ensuring the FAB stays within the document bounds.

**2. Pass `setShowModal` context** -- The FAB is inside the main `App` component's render, so `setShowModal` is already in scope. No prop threading needed.

### Visual Result
- Bright cyan circle (w-14 h-14) with cyan glow shadow
- Stacked "Start / Scan" text in bold white, ~9px
- Top-right of the paper document
- Hidden on desktop (`lg:hidden`)
- Opens the analysis modal on tap

