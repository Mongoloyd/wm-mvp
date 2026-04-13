

## Plan: Remove Inline County Red-Flag Badge from Step 5

### Change
In `src/components/TruthGateFlow.tsx`, delete lines 741-752 — the entire `<div>` block containing the pulsing dot and "{tickerToday} People in {selectedCounty} Saw Red Flags Today" message.

Nothing else changes. The social proof pill, CTA, "Your Free Report Is Yours" copy, and all logic remain untouched.

### File
`src/components/TruthGateFlow.tsx` — remove lines 741-752

### UX/CRO Recommendation

**Best move: Delete it entirely. Replace with nothing.**

Reasons:
- The relocated social proof pill already handles global credibility ("743 Quotes Scanned | +19 Today") in a cleaner, non-duplicative way
- At Step 5, the user has already committed through 4 steps — adding more proof creates friction, not confidence
- "Other Florida county" is a fallback that actively damages trust
- Removing it tightens the visual gap between the reassurance copy and the CTA, which improves scan-down conversion

**If you ever wanted a replacement (not recommended now):**

1. **"Your scan results are ready in under 60 seconds."** — shifts from social proof to speed/anticipation, which is more relevant at the submit gate
2. **"256-bit encrypted. Your quote stays private."** — addresses the #1 objection at document upload (privacy), paired with a lock icon
3. **"Join 700+ Florida homeowners who checked their quote."** — uses the same `total` from `useTickerStats()` but without the broken county variable

All three are stronger than the current line, but none are necessary. The cleanest, highest-converting option is deletion.

