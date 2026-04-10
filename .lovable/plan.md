## Plan: Equalize Hero CTAs + Fill Desktop Content Gap

### Problem

1. "Scan My Quote" and "No Quote Yet" buttons stack vertically on desktop — they should sit side-by-side as equals
2. The teal button uses orphan colors outside the design system
3. "Getting Quotes Soon — Start Here" is redundant and captures zero leads — remove it
4. On desktop, the left text column ends at the 4 trust bullets but the right column extends much further (mascot + tall grade card), leaving awkward whitespace

### Changes

**1. AuditHero.tsx — CTA layout + remove dead button**

- Delete the "Getting Quotes Soon — Start Here" button block (lines 177-193) and the `onFlowBClick` prop
- Change the CTA container (line 157) to `flex-row` on `md+` with equal sizing: both buttons get identical `font-size: 18px`, `padding: 20px 40px`, and a shared min-width so they align as a matched pair
- On mobile/tablet (`< md`), stack them full-width

**2. PowerToolDemo.tsx — Restyle the trigger button**

- Replace the hardcoded teal (`#0891B2`) with the site's danger-orange token (`hsl(var(--destructive))`) using the same `btn-depth-primary` shadow/gradient pattern but in orange
- White text, orange glow shadow — visually equal weight to "Scan My Quote" but clearly a different path
  &nbsp;
- Match dimensions exactly to "Scan My Quote"

**3. AuditHero.tsx — Add content below trust bullets (desktop only)**

- Add a `hidden md:block` section after `<TrustBullets />` that fills the vertical gap
- Content idea: a compact **social proof / stats strip** — e.g. "2,847 quotes scanned · $4.2M in overcharges identified · Avg. savings: $3,100" using the existing `useTickerStats` hook data, styled as a subtle horizontal row of 3 mini-stat cards with icons
- This adds meaningful CRO content (social proof increases conversion) while balancing the column heights
- Kept minimal — no new component file, just a small block inside AuditHero

### Files touched

1. `src/components/AuditHero.tsx` — remove Flow B button, equalize CTA row layout, add desktop stats strip
2. `src/components/PowerToolDemo.tsx` — restyle `PowerToolButton` (~lines 252-294)

### What stays the same

- PowerToolDemo modal functionality (lead capture, demo flow)
- "Scan My Quote" button behavior
- TrustBullets content
- Mobile layout (stacked, full-width)
- SampleGradeCard on desktop