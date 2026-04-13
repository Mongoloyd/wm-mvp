

## Plan: Fix Build Error and Typo in ProcessSteps.tsx

### What This Fixes
1. **Build error** on line 98: `{Step.num}` → `{step.num}` (JavaScript variable is case-sensitive)
2. **Typo** on line 47: `"A Letter gGrade: A Through F"` → `"A Letter Grade: A Through F"`

No other text or capitalization changes will be touched.

### Changes (single file: `src/components/ProcessSteps.tsx`)
- **Line 98**: Change `{Step.num}` to `{step.num}`
- **Line 47**: Change `gGrade` to `Grade`

### Files Modified
1. `src/components/ProcessSteps.tsx`

