# Reveal Page Migration — TruthReportClassic + LockedOverlay + ReportClassic Loading

We are now migrating the Reveal / Audit Results experience into the locked design system.

This is NOT a redesign.
This is NOT a new visual direction.
This is a controlled system migration + hierarchy enforcement pass.

Do not change:
- layout structure
- prop interfaces
- business logic
- copy
- callback/state behavior
- Framer Motion sequencing
- routes
- backend / Supabase / Twilio / OTP logic

Files in scope:
1. `src/components/TruthReportClassic.tsx`
2. `src/components/LockedOverlay.tsx`
3. `src/pages/ReportClassic.tsx` (loading state only)

==================================================
GLOBAL RULES
==================================================

1. Use the LOCKED design system only.
2. Do not invent new visual styles.
3. Do not flatten the reveal page into generic homepage styling.
4. Preserve dominance of:
   - grade / verdict strip
   - locked overlay card
   - primary unlock CTA
   - highest-urgency findings
   - negotiation script / leverage sections where the stakes are highest

==================================================
COLOR ROLE RULES (CRITICAL)
==================================================

Do NOT collapse all accents into primary blue.

Reveal page semantic color roles must remain:

- blue = system structure / CTA trust / neutral controls
- red = critical / danger / severe risk
- amber/gold = caution / negotiation leverage / money at risk / important warning
- green = safe / pass / verified
- cyan = AI/system activity only where semantically correct

Allowed:
- structural UI accents can use primary blue
- severity, risk, money, and caution accents must retain non-blue semantics

Do NOT map:
- gold → primary blue
- amber → primary blue
- danger → primary blue
unless the element is truly structural rather than semantic

==================================================
PHASE 1 — TOKEN / STYLE NORMALIZATION
==================================================

Replace noir inline styling with locked system classes/tokens.

### Background surfaces
- Replace `#0A0A0A` root/section/card backgrounds with:
  - `bg-background`
  - `bg-secondary`
  - `section-recessed`
  - `card-raised`
  - `card-dominant`
depending on role

Do NOT use `bg-background` everywhere.
Preserve surface hierarchy.

### Text
Replace raw hex text colors with semantic text classes/tokens:
- `text-foreground`
- `text-muted-foreground`
- `font-display`
- `font-body`
- `font-mono`

Remove `Jost` entirely.

### Borders
Replace raw borders with semantic borders:
- `border-border`
- severity borders using semantic danger / caution / success tokens
- keep dynamic severity mapping where required

### Shadows
Replace inline `boxShadow` with system surfaces/shadow classes wherever possible.
Keep inline shadow/color only when truly data-driven.

### Radius
Replace `borderRadius: 0` and one-off radii with locked system radii:
- card radius
- button radius
- input radius
- `rounded-full` for circles only

==================================================
PHASE 2 — STRUCTURAL MAPPING
==================================================

Map reveal sections to the locked system intentionally:

1. Root page shell → `bg-background`
2. Report header / shell framing → structural, restrained, system-trust styling
3. Grade / verdict strip → highest visual weight, dominant surface, strongest hierarchy on page
4. Proof-of-read / summary strip → quieter recessed band
5. 5-Pillar section → page field + raised pillar cards
6. Forensic findings / evidence → quieter than verdict strip, scannable cards with severity accents preserved
7. Negotiation / script / leverage areas → elevated enough to feel important, caution / leverage semantics preserved
8. CTA area → primary unlock CTA uses locked primary CTA system, secondary uses locked secondary
9. Locked overlay → dominant gate card, valuable, serious, premium — not just re-skinned
10. Loading state → migrate out of noir into locked system

==================================================
PHASE 3 — HIERARCHY ENFORCEMENT
==================================================

Ensure:
- grade/verdict is immediately legible at a glance
- locked overlay card is clearly dominant when shown
- pillar cards are secondary to verdict
- evidence/finding blocks are quieter than verdict but still easy to scan
- CTA prominence is strong in unlock moments

Fix with elevation, surface contrast, typography weight, spacing — NOT layout changes.

==================================================
PHASE 4 — SEVERITY COLOR BRIDGE
==================================================

The following may remain as JS config objects because they are data-driven:
- `gradeConfig`
- `statusConfig`
- `severityStyles`

Refactor so they reference locked semantic tokens / HSL values rather than noir hex values.

Important:
- preserve red / amber / green / gold semantic meaning
- do not collapse these into blue
- cyan only where semantically correct for AI/system activity

This is the primary acceptable exception to "no inline styles."

==================================================
PHASE 5 — LOCKED OVERLAY MIGRATION
==================================================

Apply the same system rules to `LockedOverlay.tsx`.

Requirements:
- remove noir backgrounds
- remove Jost
- preserve dominant gate card hierarchy
- preserve input quality / OTP slot clarity
- keep gate feeling valuable and high-stakes
- use locked CTA/button system
- preserve caution / urgency accents where semantically correct

Do NOT flatten LockedOverlay into generic page styling.

==================================================
PHASE 6 — READABILITY + DENSITY CHECK
==================================================

After migration, verify:
- grade/verdict area is immediately legible at a glance
- findings can be scanned quickly
- muted/support text is not too faint on light surfaces
- dense sections remain readable without visual fatigue
- negotiation / leverage sections still feel important

==================================================
PHASE 7 — FINAL AUDIT
==================================================

After implementation, audit and report any remaining:
- raw hex values
- inline `boxShadow`
- `Jost` font references
- `borderRadius: 0`
- noir backgrounds

List each by file, approximate line area, and reason it remains.

Also report:
1. which sections were mapped to which locked system classes
2. which inline styles remain and why
3. whether any severity semantics were preserved as exceptions
4. confirmation that layout, business logic, and only presentation layer was migrated

==================================================
IMPLEMENTATION ORDER
==================================================

1. Refactor `gradeConfig` / `statusConfig` / `severityStyles` to semantic token references
2. Migrate `TruthReportClassic.tsx` section by section
3. Migrate `LockedOverlay.tsx`
4. Migrate `ReportClassic.tsx` loading state
5. Run final audit and report
6. STOP for review

==================================================
OPEN QUESTIONS / EDGE CASES
==================================================

### Q1: Gold accent on LockedOverlay gate — keep gold or switch to primary blue?
The gate CTA ("Unlock Your Report") is the highest-conversion moment. Gold communicates urgency/value. Blue communicates trust/system.
**Recommendation:** Use `btn-depth-primary` (blue system) for the unlock CTA button itself (trust = conversion), but keep gold/amber semantic accents on the surrounding urgency copy, lock icons, and "flags found" teasers. This preserves the emotional tension without contradicting the button system.

### Q2: Cyan accent usage
Currently cyan (#0099BB) is used for negotiation script borders, "how to use this" labels, and some structural accents. Some of these are truly "system/AI" semantic (keep cyan). Others are just generic accents that should become `primary` blue.
**Recommendation:** Audit each cyan usage individually. Script/leverage borders → keep as a distinct accent (map to a `--color-cyan` token). Generic structural labels → migrate to `text-primary`.

### Q3: Grade circle dynamic border + glow
The grade circle uses `border: 4px solid ${config.color}` and a matching glow shadow. This is data-driven and must stay inline. But should the glow intensity match noir (heavy, dramatic) or be toned to match the lighter system surfaces?
**Recommendation:** Reduce glow opacity slightly (from 0.35 → 0.25) so it doesn't overpower on lighter card surfaces, but keep the color mapping intact.

### Q4: Dark mode assumption
The current locked design system defines dark-mode HSL values. The reveal page was built for dark backgrounds. If the system ever adds a light mode toggle, these semantic tokens will auto-adapt. No extra work needed now, but flagging that severity color contrast ratios should be validated against both `--background` values.
**Recommendation:** No action now. Note for future light-mode pass.

### Q5: Missing semantic tokens
The locked system may not have dedicated tokens for every severity color. We may need to add CSS custom properties:
- `--color-danger` (red)
- `--color-caution` / `--color-gold-accent` (amber/gold)
- `--color-success` / `--color-emerald` (green)
- `--color-cyan` (AI/system accent)

**Recommendation:** Add these to `index.css` as part of Phase 1 if they don't already exist. They are semantic role tokens, not new design — they codify what already exists.
