

## Plan: Add OCR Screenshot Below Stats Strip on Desktop

### What
Place the uploaded `scan_ocr.avif` image below the stats strip on desktop (left column), positioned to the left of the grade card. The image lazy-loads with a slide-up/fade-in animation.

### Changes to `src/components/AuditHero.tsx`

1. **Copy the uploaded image** into `src/assets/scan_ocr.avif`
2. **Import it** at the top of AuditHero
3. **Add a new block after the stats strip** (line 201, inside the left column `motion.div`), visible only on `lg+`:
   - Wrapped in a `motion.div` with `initial={{ opacity: 0, y: 30 }}` and `whileInView={{ opacity: 1, y: 0 }}` with `viewport={{ once: true }}`
   - The image uses `loading="lazy"`, rounded corners, subtle shadow
   - Constrained width (~`max-w-sm`) so it sits naturally to the left of the grade card in the right column
4. **On tablet** (order-4 block, lines 204-218): add the same image above or below the stats strip, centered, with the same animation

### Files touched
1. `src/components/AuditHero.tsx` — add lazy-loaded image block
2. Copy `user-uploads://scan_ocr.avif` → `src/assets/scan_ocr.avif`

