

## Issues Found in PowerToolDemo

Looking at your screenshot and the code, I see **two problems**:

### 1. CTA text still says "Sample" instead of "Tailored"
On line 35 of `PowerToolDemo.tsx`, both step 1 headline and step 2 CTA still say **"Sample"**:
- Step 1 headline: `"See a Sample AI Truth Report"`
- Step 2 CTA button: `"Show Me a Sample AI Truth Report →"`

Both need to be changed to **"Tailored"**.

### 2. Hardcoded numbers still present in 3 components
As previously identified:
- **TruthGateFlow**: hardcoded `14` → should use `useTickerStats().today`
- **ClosingManifesto**: hardcoded `4,127` → should use `useTickerStats().total`
- **FlowBEntry**: hardcoded `4,127` → should use `useTickerStats().total`

### Plan

**File: `src/components/PowerToolDemo.tsx` (line 35)**
- Change step 1 headline from `"See a Sample AI Truth Report"` → `"See a Tailored AI Truth Report"`
- Change step 2 CTA from `"Show Me a Sample AI Truth Report →"` → `"Show Me a Tailored AI Truth Report →"`

**File: `src/components/TruthGateFlow.tsx`**
- Import `useTickerStats`, replace hardcoded `14` with `today` value

**File: `src/components/ClosingManifesto.tsx`**
- Import `useTickerStats`, replace hardcoded `4,127` with `total.toLocaleString()`

**File: `src/components/FlowBEntry.tsx`**
- Import `useTickerStats`, replace hardcoded `4,127` with `total.toLocaleString()`

Total: 4 files, all small surgical edits.

