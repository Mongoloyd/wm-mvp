

## Remove 3 Cards from MarketMakerManifesto

**File:** `src/components/MarketMakerManifesto.tsx`

**What changes:**
Delete the last 3 entries from the card array (lines 124-153):
- "Hidden Cost Traps" (Search icon, orange)
- "The Negotiation Script" (ArrowRight icon, primary)
- "Warranty Protection Audit" (Home icon, gold)

This leaves 3 cards in the grid: "What Do You Get — Free", "So How Do I Make Money", and "Why Work With Me".

**No other changes needed:**
- All icon imports (`Home`, `ArrowRight`, `Search`) are still used in the flow diagram above the cards
- Grid class (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) fits perfectly with 3 remaining cards
- No global tokens, fonts, or layout wrappers are touched

