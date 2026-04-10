

## Plan: Add Forensic Explanations to Red Flags

### What We're Building
An "Advisor List" section that replaces or enhances the current `RedFlagsList` component to show expert reasoning underneath each red flag title, helping homeowners understand *why* each issue matters.

### Layout Design
- Clean paper background (`#FAF9F6`)
- Each flag: **bold title** (text-slate-900) + **explanation** underneath (text-slate-600, text-sm)
- Items separated by thin hairlines (`border-t border-slate-200`)
- Generous vertical padding (`py-4`) per item for airy, scannable feel

### Implementation

**1. Create a reasoning map** (`src/utils/flagReasoningMap.ts`)

A keyword-matched lookup (same pattern as `evidenceMapping.ts`) mapping ~18 flag labels to expert explanations:

- `missing_dp_rating` → "The Design Pressure (DP) rating determines the wind load..."
- `missing_noa_number` → "The Notice of Acceptance (NOA) is the 'legal birth certificate'..."
- `no_permits_mentioned` → "Permits are your primary legal protection..."
- `vague_install_scope` / `wall_repair_missing` / `completion_timeline_missing` / `opening_schedule_missing` / `waterproofing_missing`
- `state_jurisdiction_mismatch`, `glass_package_unverifiable`, `unspecified_brand`, `no_warranty_section`, `no_cancellation_policy`, `missing_line_item_pricing`
- Plus remaining flags from the full list

Uses keyword matching on the flag label (same approach as `LABEL_KEYWORDS` in `evidenceMapping.ts`).

**2. Update `RedFlagsList.tsx`**

- Import the reasoning map
- For each warning, resolve the reasoning text via keyword match
- Render: title (bold, slate-900) → reasoning (sm, slate-600) → hairline separator
- Wrap in `#FAF9F6` background, system UI font
- `py-4` spacing between items keeps it airy despite 18+ items

**3. No backend/edge function/OTP changes needed**

This is purely a frontend presentation change. The data already flows correctly:
- `warnings` array comes from `full_json` (already gated behind OTP)
- `RedFlagsList` only renders in `isFull` mode (line 603)
- The reasoning map is a static client-side dictionary — no new API calls

### Risk Assessment
- **No OTP issues**: Warnings only render post-verification
- **No edge function changes**: Static map, no backend touch
- **No error risk**: Keyword match returns `null` for unknown flags — component gracefully skips the explanation line
- **No data model changes**: Pure UI layer addition

### Files to Create/Edit
1. **Create** `src/utils/flagReasoningMap.ts` — keyword→explanation dictionary
2. **Edit** `src/components/report/RedFlagsList.tsx` — add reasoning display + paper styling

