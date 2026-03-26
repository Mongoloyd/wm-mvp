

# Final Implementation Plan: Light Forensic Report Migration

## Assessment: User Spec vs Previous Plan

The user's deterministic spec is **strictly stronger** in 4 areas:

1. **Surface hierarchy** — spec mandates `card-raised`, `card-dominant`, `section-recessed` classes (not just `bg-background`/`bg-card`). My plan under-specified this.
2. **Typography utilities** — spec requires `.wm-eyebrow`, `.wm-title-section`, `.wm-body` classes. My plan stopped at `font-display`/`font-body`/`font-mono`.
3. **Explicit removal list** — spec catalogs every pattern to eliminate. My plan was implicit.
4. **Post-implementation audit** — spec requires a structured verification output.

My plan added one thing the spec didn't cover: the `gradeConfig`/`statusConfig`/`severityStyles` HSL opacity syntax fix (the `${color}1A` bug). The spec mentions it but less precisely.

**Final plan = user's spec + the HSL opacity fix + one new CSS class (`btn-depth-gold--pending`).**

---

## Pre-Implementation: Add `btn-depth-gold--pending` to `index.css`

```css
.btn-depth-gold--pending {
  /* same structural props as btn-depth-gold but muted */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg,
    hsl(var(--color-gold-accent) / 0.15) 0%,
    hsl(var(--color-gold-accent) / 0.08) 100%);
  color: hsl(var(--color-gold-accent) / 0.5);
  border: 1px solid hsl(var(--color-gold-accent) / 0.2);
  border-radius: var(--radius-btn);
  box-shadow: none;
  cursor: default;
  transform: none;
  font-family: var(--wm-font-body);
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 0.2s ease, color 0.2s ease;
}
.btn-depth-gold--pending::after { content: none; }
```

---

## File 1: `TruthReportClassic.tsx` (746 lines)

### A. Config objects (lines 43–70) — HSL opacity fix

Convert all hex colors to `hsl(var(--color-*))` tokens. Fix the opacity pattern:

**gradeConfig:**
- `color: "#059669"` → `"hsl(var(--color-emerald))"`
- `bg: "rgba(5,150,105,0.12)"` → `"hsl(var(--color-emerald) / 0.12)"`
- B: color → `hsl(var(--color-lime))`, bg → `hsl(var(--color-lime) / 0.12)`
- C: color → `hsl(var(--color-caution))`, bg → `hsl(var(--color-caution) / 0.12)`
- D: color → `hsl(var(--color-danger))`, bg → `hsl(var(--color-danger) / 0.12)`
- F: color → `hsl(var(--color-danger))` (full), bg → `hsl(var(--color-danger) / 0.12)`

**statusConfig:** Same pattern for pass/warn/fail/pending.

**severityStyles:** Same pattern. All `border`, `borderLeft`, `badgeBg`, `badgeColor` → tokenized HSL.

**Critical fix:** Line 178 `boxShadow: \`0 0 0 6px ${config.color}1A\`` → `boxShadow: \`0 0 0 6px hsl(var(--color-*) / 0.1)\`` — but since config.color is now an hsl() string, we need a separate `glow` field in gradeConfig that stores `hsl(var(--color-emerald) / 0.1)` etc.

### B. Outer container (line 149)

`style={{ background: "#0A0A0A" }}` → `className="bg-background min-h-screen"`

### C. All section wrappers — surface system

| Line | Current | New className |
|---|---|---|
| 151 | `background: "#0A0A0A", borderBottom: rgba` | `bg-background border-b border-border` |
| 187 | Grade verdict (dynamic bg) | Keep `style={{ background: config.bg }}` + `border-b-2` with dynamic border |
| 236 | Proof-of-read `#111111` | `card-raised` (it's a trust strip — elevated) |
| 271 | 5-pillar section `#0A0A0A` | `bg-background border-b border-border` |
| 346 | Forensic findings `#0A0A0A` | `bg-background border-b border-border` |
| 466 | Negotiation script `#0A0A0A` | `bg-background border-b border-border` |
| 510 | CTA section `#0A0A0A` | `bg-background` |
| 716 | Footer `#0A0A0A` | `bg-background border-t border-border` |

### D. Typography — all inline `fontFamily` → classes

~60 occurrences across the file:
- `fontFamily: "'Jost', sans-serif"` → remove style, add `font-display` to className
- `fontFamily: "'DM Sans', sans-serif"` → `font-body`
- `fontFamily: "'DM Mono', monospace"` → `font-mono`

Where an element also uses `.wm-eyebrow` pattern (11px, mono, uppercase, tracking): replace the full inline style block with `className="wm-eyebrow"` + only the color override.

Where heading pattern matches: use `wm-title-section`.

### E. Text colors → Tailwind classes

- `color: "#FFFFFF"` / `"white"` → `text-foreground`
- `color: "#E5E7EB"` / `"#D1D5DB"` → `text-foreground/90`
- `color: "#9CA3AF"` / `"#94A3B8"` → `text-muted-foreground`
- `color: "#64748B"` → `text-muted-foreground/70`
- Severity/semantic colors → `style={{ color: "hsl(var(--color-*))" }}`

### F. Pillar cards (lines 292–338)

- `background: "#0A0A0A"` → `className="card-raised"`
- `borderRadius: 0` → remove (card-raised provides `--radius-card`)
- `boxShadow: "none"` → remove (card-raised provides `--shadow-resting`)
- Status badge `borderRadius: 0` → remove
- Pillar label chip `background: sc.bg, borderRadius: 0` → remove borderRadius

### G. Flag cards (lines 374–431)

- `background: "#0A0A0A"` → `className="card-raised"` + severity border stays via style
- `borderRadius: 0` → remove
- Inner chip backgrounds → tokenized
- `#111111` pillar label bg → `bg-secondary`
- Tip box `background: s.tipBg || "#F9FAFB"` → keep tipBg tokenized, fallback → `hsl(var(--card))`
- Inner border `rgba(255,255,255,0.1)` → `border-border`

### H. County benchmark badge (line 359)

`background: "rgba(0,153,187,0.12)"` → `hsl(var(--color-cyan) / 0.12)`
`border: "1px solid #0099BB"` → `1px solid hsl(var(--color-cyan))`
`color: "#0099BB"` → `hsl(var(--color-cyan))`

### I. Negotiation script block (lines 478–502)

- `background: "#111111"` → `className="card-raised"`
- `borderLeft: "4px solid #0099BB"` → `border-l-4` + `style={{ borderLeftColor: "hsl(var(--color-cyan))" }}`
- Copy button `background: "#111111"` → remove (inherits card)
- Copy button border → `border border-border`

### J. CTA section buttons (lines 530–570)

- **Gold CTA** (line 530–543): `className="btn-depth-gold w-full py-4 px-8 text-[17px]"` — removes ~10 lines of inline style
- Loading state: add conditional `className` for `btn-depth-gold` vs inline `bg-primary` when loading
- **Secondary CTA** (line 546–559): `className="btn-secondary-tactile w-full py-3.5 px-7 text-[15px]"` — replaces invisible ghost button
- **"Scan Another"** link button: `text-muted-foreground hover:text-foreground` — minimal text link, no surface

### K. Match card + process strip (lines 582–711)

- `background: "#111111"` → `className="card-raised"`
- `border: "1px solid rgba(200,149,42,0.3)"` → `border` + `style={{ borderColor: "hsl(var(--color-gold-accent) / 0.3)" }}`
- `border: "1px solid #1A1A1A"` → `border border-border`
- Confidence badge colors → tokenized HSL
- "How WindowMan Vets" box (line 691) → `className="card-raised"` + remove borderRadius: 0

### L. Summary bar (line 454)

- `background: "#0A0A0A", borderRadius: 0` → `className="card-raised"`
- `color: "white"` → `text-foreground`
- `color: "#f7f7f7"` → `text-foreground`

### M. Radius

Remove ALL `borderRadius: 0`. System classes provide correct radius. Dynamic grade circle stays `borderRadius: "50%"` (circle, not a card).

---

## File 2: `LockedOverlay.tsx` (799 lines)

### A. Blurred redacted cards (lines 131–178)

- `background: "#0A0A0A"` → `className="card-raised"`
- `borderRadius: 0` → remove
- `border: "1.5px solid #FECACA"` → keep (severity visual, acceptable exception)
- `borderLeft: "4px solid #DC2626"` → `4px solid hsl(var(--color-danger))`
- Badge `background: "rgba(220,38,38,0.12)"` → `hsl(var(--color-danger) / 0.12)`
- All `fontFamily` → `font-mono`, `font-body` classes
- `color: "#DC2626"` → `hsl(var(--color-danger))`
- `color: "#FFFFFF"` → `text-foreground`

### B. Gate overlay backdrop (lines 182–188)

- `background: "rgba(10,10,10,0.85)"` → **KEEP** (dark scrim exception)
- `borderRadius: 0` → remove
- `backdropFilter: "blur(2px)"` → keep

### C. Gate card (lines 190–203)

- `background: "#0A0A0A"` → **light surface**: `className="card-raised-hero"` (L2 — this is the highest-stakes modal)
- `borderRadius: 0` → remove (card-raised-hero provides `--radius-card`)
- Gold inset shadow → `hsl(var(--color-gold-accent) / 0.12)`
- All `fontFamily` → classes

### D. Progress bar (lines 206–251)

- Track `background: "rgba(255,255,255,0.08)"` → `bg-secondary` (visible on light)
- Track `borderRadius: 0` → remove
- Fill gradient `#C8952A, #E2B04A` → keep (gradient exception, no token)
- Fill `borderRadius: 0` → remove
- Fill glow → `hsl(var(--color-gold-accent) / 0.4)`

### E. All gold accent colors

- `#C8952A` / `#E2B04A` → `hsl(var(--color-gold-accent))` everywhere except gradient stops

### F. Text colors inside gate

With light gate card surface:
- `color: "#FFFFFF"` → `text-foreground` (now dark text on light card)
- `color: "#94A3B8"` → `text-muted-foreground`
- `color: "#C8952A"` → `style={{ color: "hsl(var(--color-gold-accent))" }}`
- `color: "#64748B"` → `text-muted-foreground/70`

### G. Error block (lines 302–376)

- `background: "rgba(220,38,38,0.08)"` → `hsl(var(--color-danger) / 0.08)`
- `border: "1px solid rgba(220,38,38,0.25)"` → `hsl(var(--color-danger) / 0.25)`
- `borderRadius: 0` → remove
- `color: "#DC2626"` → `hsl(var(--color-danger))`
- `color: "#F59E0B"` → `hsl(var(--color-caution))`
- Recovery button `background: "rgba(200,149,42,0.15)"` → `hsl(var(--color-gold-accent) / 0.15)` + remove borderRadius: 0

### H. Fetch-stalled retry button (lines 408–427)

- Replace inline gold gradient button → `className="btn-depth-gold py-2.5 px-6 text-sm"`
- Remove ~15 lines of inline style

### I. OTP input slots (line 453)

- `!border-[#f7f7f733]` → `!border-border`
- `!bg-[rgba(255,255,255,0.06)]` → `!bg-secondary`
- `!text-[#f7f7f7]` → `!text-foreground`
- Parent wrapper `[&_input]:!bg-transparent [&_input]:!text-[#f7f7f7]` → `[&_input]:!bg-transparent [&_input]:!text-foreground`

### J. OTP submit button (lines 460–508) — TWO states

**Ready** (`otpValue.length === 6`): `className="btn-depth-gold w-full max-w-[320px] h-[54px] text-[17px]"`
**Not ready** (`otpValue.length < 6`): `className="btn-depth-gold--pending w-full max-w-[320px] h-[54px] text-[17px]"`

Conditional: `className={otpValue.length === 6 ? "btn-depth-gold ..." : "btn-depth-gold--pending ..."}`

Removes ~40 lines of inline style.

### K. Send code button (lines 561–598)

Replace inline gold button → `className="btn-depth-gold w-full max-w-[320px] h-[54px] text-[17px]"`
Removes ~30 lines of inline style.

### L. Phone input (lines 628–668)

- `background: "rgba(255,255,255,0.07)"` → `className="wm-input-well"` (sunken input on light surface)
- `border: "2px solid rgba(255,255,255,0.1)"` → handled by `wm-input-well` + dynamic gold border when valid
- `borderRadius: 0` → remove (wm-input-well provides `--radius-input`)
- `color: "#FFFFFF"` → `text-foreground`
- `caretColor: "#C8952A"` → `hsl(var(--color-gold-accent))`
- onFocus/onBlur bg changes → remove (wm-input-well handles focus via `:focus` pseudo-class)
- Valid state border: `style={{ borderColor: "hsl(var(--color-gold-accent))" }}`

### M. Phone submit button (lines 736–777)

Same two-state pattern as OTP:
- **Can submit** → `className="btn-depth-gold w-full max-w-[320px] h-[54px] text-[17px]"`
- **Cannot submit** → `className="btn-depth-gold--pending w-full max-w-[320px] h-[54px] text-[17px]"`

Removes ~35 lines of inline style.

### N. TCPA checkbox (lines 703–734)

- `accentColor: "#C8952A"` → `hsl(var(--color-gold-accent))`
- `color: "#64748B"` → `text-muted-foreground/70`
- `fontFamily` → `font-body`

### O. Trust micro-copy (lines 782–794)

- `fontFamily` → `font-mono` class
- `color: "#64748B"` → `text-muted-foreground/70`

### P. Resend / Wrong number links (lines 512–546)

- `fontFamily` → `font-body` class
- `color: "#94A3B8"` → `text-muted-foreground`
- `color: "#64748B"` → `text-muted-foreground/70`

---

## File 3: `ReportClassic.tsx` — Loading state only

Already migrated (lines 283–291 use `bg-background`, `font-body`, `text-muted-foreground`). **No changes needed.**

Terminal states (lines 322–370) also already use system tokens. **No changes needed.**

---

## What stays UNCHANGED

- All props, state, callbacks, business logic
- Framer Motion `initial`/`animate`/`transition` props
- SVG `stroke` attributes (inline required)
- Gate overlay `rgba(10,10,10,0.85)` dark scrim
- Progress bar gold gradient stops
- JSX hierarchy and layout structure
- Supabase / Twilio / OTP logic in ReportClassic.tsx

---

## Implementation order

1. Add `btn-depth-gold--pending` to `index.css`
2. Migrate `TruthReportClassic.tsx` (config objects first, then top-to-bottom sections)
3. Migrate `LockedOverlay.tsx` (gate card first, then inputs/buttons)
4. Post-implementation audit output (files modified, remaining hex, remaining inline styles, radius confirmation, input visibility, CTA hierarchy)

---

## Total impact

- ~120 inline style removals
- 5 CTA buttons collapse from ~30-40 lines each to 1 className
- All hex colors → design tokens
- All fonts → system classes
- All radii → system tokens
- Zero logic changes
- 1 new CSS class added

