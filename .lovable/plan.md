## Plan: Convert ForensicShift to Local Demo + Mount on DevTesting

Two files changed. No other files touched.

### File 1: `src/components/Forensicshift.jsx`

**Remove (lines 144-206):**

- `errorMsg` state
- Entire `handleAnalyze` async function (apiKey, Gemini URL, prompt, payload, fetch, try/catch)

**Add:**

- `analyzedData` — a second hardcoded dataset representing "post-analysis" results
- `hasAnalyzed` state (boolean) to track whether demo has run
- New `handleAnalyze` function: closes modal, sets `isAnalyzing` true, waits 2500-4000ms via `setTimeout`, then swaps `data` to `analyzedData` and sets `isAnalyzing` false
- `handleReset` function: resets `data` to `defaultData`, clears `hasAnalyzed`

**Modify in header (line 210-220):**

- Add a "Reset Demo" button (visible only when `hasAnalyzed` is true) next to the "Analyze Quote" button

**Modify in modal (lines 277-299):**

- Remove `errorMsg` display (line 286)
- Keep textarea and modal structure intact for theatrical realism
- Wire "Start AI Analysis" button to the new local `handleAnalyze`

**Keep untouched:** `defaultData`, `DocumentContent`, all split-view layout, scan line, loading overlay, custom scrollbar CSS, `showModal`/`quoteText` state.

**Rename default export** from `App` to `ForensicShift` for clarity.

**Analyzed data example:**

```js
const analyzedData = {
  homeownerBulletPoints: [
    "Total Price: $12,000",
    "Premium Shingles",
    "Labor Included"
  ],
  machineBulletPoints: [
    "14% Markup Detected",
    "No Permit\nDocumentation",
    "Warranty Scope\nUndefined"
  ],
  invoiceRows: [
    { qty: "1", desc: "Architectural Shingles Removal", price: "$2,500" },
    { qty: "1", desc: "Roof Decking Repair", price: "$1,200" },
    { qty: "30", desc: "Bundles Premium Shingles", price: "$6,000" },
    { qty: "1", desc: "Labor", price: "INCLUDED" },
    { qty: "-", desc: "Taxes & Processing", price: "$800" },
    { qty: "-", desc: "Local Markup (Estimated)", price: "$1,500" },
  ],
  subtotal: "$10,500",
  taxesAndFees: "$1,500",
  totalPrice: "$12,000",
  footerNote: "Estimate based on standard removal and replacement. Warranty terms not specified. Permit fees and inspections not addressed. All figures are approximate."
};
```

### File 2: `src/pages/DevTesting.tsx`

Add `ForensicShift` import and render it below `ArbitrageEngine` with a section divider:

```tsx
import ArbitrageEngine from "@/components/arbitrageengine";
import ForensicShift from "@/components/Forensicshift";

export default function DevTesting() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4">
      <ArbitrageEngine />
      <div className="py-12">
        <h2 className="text-white text-2xl font-bold text-center mb-6">Forensic Shift Demo</h2>
        <ForensicShift />
      </div>
    </div>
  );
}
```

### Net result

- ~60 lines of Gemini/fetch code removed
- ~30 lines of local demo logic + hardcoded dataset added
- 1 new import + 5 lines added to DevTesting
- Zero homepage impact

&nbsp;

Implementation guardrails:

- Keep `ForensicShift` fully isolated on `/devtesting`

- Do not let `ForensicShift` and `ArbitrageEngine` share state or interact in any way

- If `isAnalyzing` is already true, `handleAnalyze` should return early

- Disable the modal submit button while the demo is running

- `handleReset` should fully restore the initial demo state

- If visible copy still says Gemini, update that copy to reflect a local demo simulation rather than a real API call