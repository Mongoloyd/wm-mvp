

## Plan: Align Homepage Typography to Match About Page

### Problem
The homepage sections use inconsistent typography: `wm-eyebrow`/`wm-title-section` CSS classes with inline `style={{ color: "hsl(210 50% 8%)" }}`, `clamp()` font sizes, and mixed heading patterns. The About page uses a clean, consistent system with `SectionEyebrow` and `SectionHeading` components plus Tailwind semantic classes (`text-foreground`, `text-foreground/80`, `text-muted-foreground`).

### Target System (from About page)
- **Eyebrows**: `font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground`
- **Section headings**: `font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-foreground`
- **Body text**: `text-base md:text-lg leading-relaxed text-foreground/80`
- **Card headings**: `font-display text-2xl font-bold tracking-tight text-foreground`

### Components to Update

**1. AuditHero.tsx** (hero section)
- H1: Replace inline `style={{ fontSize: "clamp(...)", color: "hsl(210 50% 8%)" }}` with Tailwind classes matching About hero (`text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground`)
- Subtitle: Replace inline color/size styles with `text-base md:text-lg leading-relaxed text-foreground/80`
- Stats strip: Replace `style={{ color: "hsl(210 50% 8%)" }}` with `text-foreground`
- Eyebrow pill: Already uses `wm-eyebrow text-primary` -- keep `text-primary` but align font properties

**2. IndustryTruth.tsx**
- Eyebrow: Replace `wm-eyebrow text-primary` with About-style eyebrow classes
- H2: Already uses Tailwind classes; ensure `font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-foreground` pattern
- Body: Replace `wm-body` with `text-base md:text-lg leading-relaxed text-foreground/80`
- Card headings: Use `font-display text-xl font-bold text-foreground uppercase tracking-tight`

**3. ProcessSteps.tsx**
- Eyebrow: Replace `font-mono text-[11px] tracking-[0.18em] text-primary` with consistent eyebrow pattern using `text-muted-foreground` (or keep `text-primary` if accent is desired)
- H2: Replace `text-3xl sm:text-4xl lg:text-5xl font-bold` with `font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-foreground`
- Body: Use `text-base md:text-lg leading-relaxed text-foreground/80`

**4. NarrativeProof.tsx**
- Eyebrow: Replace `wm-eyebrow text-primary` with consistent pattern
- H2: Replace `wm-title-section` + inline `style={{ fontSize: "clamp(...)", color }}` with Tailwind heading classes
- Subtitle: Replace inline approach with `text-base text-foreground/80`

**5. ClosingManifesto.tsx**
- Eyebrow: Replace `wm-eyebrow text-muted-foreground` classes
- Heading: Replace `wm-title-section` + inline color with Tailwind heading classes
- Accent line: Keep `text-primary` but use `font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight`

**6. Testimonials.tsx**
- Eyebrow: Replace `wm-eyebrow text-primary`
- H2: Replace `wm-title-section text-lg md:text-4xl` with proper heading classes
- Body text in cards: Replace `wm-body` with semantic classes

**7. MarketMakerManifesto.tsx**
- H2: Replace inline `style={{ fontSize: "clamp(...)" }}` with Tailwind responsive classes
- Already uses `font-display font-extrabold text-foreground` which is close; just remove inline styles

**8. QuoteSpreadShowcase.tsx**
- H2 footer text: Already uses `text-3xl font-extrabold text-white` which works for its dark context; align tracking/font-display

### Approach
- Remove all inline `style={{ color: "hsl(210 50% 8%)" }}` and `style={{ fontSize: "clamp(...)" }}` in headings
- Replace `wm-eyebrow`, `wm-title-section`, and `wm-body` CSS class usage with Tailwind utility classes matching the About page patterns
- Use `font-display` for headings, standard Tailwind text sizing (`text-4xl md:text-5xl`), and semantic color tokens (`text-foreground`, `text-foreground/80`, `text-muted-foreground`)

### Files Modified
1. `src/components/AuditHero.tsx`
2. `src/components/IndustryTruth.tsx`
3. `src/components/ProcessSteps.tsx`
4. `src/components/NarrativeProof.tsx`
5. `src/components/ClosingManifesto.tsx`
6. `src/components/Testimonials.tsx`
7. `src/components/MarketMakerManifesto.tsx`
8. `src/components/QuoteSpreadShowcase.tsx`

