

## Plan: Swap Card Content Between NarrativeProof and Testimonials

### What's happening
The two narrative story cards (Maria/David with grades, flags, outcomes) swap places with the testimonial review carousel (6 star-rated reviews). Headers, subtext, CTAs, and stats strips stay exactly where they are.

### Changes

**1. `src/components/NarrativeProof.tsx`**
- Remove the `stories` array and its card rendering (lines 4-7, 31-60)
- Import `Star` from lucide-react, `useEmblaCarousel`, and `Autoplay`
- Add the `reviews` array (6 review objects) currently in Testimonials
- Add the Embla carousel setup (autoplay, reduced-motion check, dot nav, selectedIndex state)
- Render the testimonial review cards inside the carousel where the story cards used to be (between the header and the bottom CTA card)
- Keep the existing header ("REAL RESULTS FROM FLORIDA HOMEOWNERS" / "WHAT HAPPENS WHEN YOU KNOW THE TRUTH."), bottom CTA card, and all props unchanged

**2. `src/components/Testimonials.tsx`**
- Remove the `reviews` array, Embla imports, carousel logic, and dot navigation
- Add the `stories` array (Maria + David) currently in NarrativeProof
- Render the two narrative proof cards in a `grid grid-cols-1 md:grid-cols-2 gap-8` where the carousel used to be (between the header and stats strip)
- Each card keeps its grade badge, narrative paragraphs, result checkmark, and red flag pill
- Keep the existing header ("Real Homeowner Results" / "What Homeowners Are Saying"), stats strip, and bottom CTA unchanged

### Files touched
1. `src/components/NarrativeProof.tsx` — replace story cards with review carousel
2. `src/components/Testimonials.tsx` — replace review carousel with story cards

### What stays the same
- All headers, subtext, eyebrows in both sections
- Stats strip in Testimonials
- Bottom CTA blocks in both sections
- All props and click handlers
- Page order / component placement in Index.tsx

