

## Plan: Import Contractors3 Page from Project Harmonizer

### What
Copy the entire `src/pages/contractors3/` directory from [Project Harmonizer](/projects/426ee123-ee09-4bb3-a36d-88231683fbb1) verbatim into this project and wire it up at `/contractors3`.

### Files to copy (21 files, all `.jsx` except root `.tsx`)

```text
src/pages/contractors3/
├── Contractors3.tsx
├── config/
│   └── page.config.js
├── lib/
│   └── qualificationLogic.js
└── components/
    ├── layout/
    │   └── PageWrapper.jsx
    ├── qualification/
    │   ├── QualificationFlow.jsx
    │   ├── OptionButton.jsx
    │   └── StepCard.jsx
    ├── sections/
    │   ├── HeroSection.jsx
    │   ├── MarketTruthSection.jsx
    │   ├── CompetitorQuoteSection.jsx
    │   ├── BuyerReadinessSection.jsx
    │   ├── HowItWorksSection.jsx
    │   ├── EconomicsSection.jsx
    │   ├── DifferentiationSection.jsx
    │   ├── ExclusivitySection.jsx
    │   ├── VideoSection.jsx
    │   ├── BookingSection.jsx
    │   ├── NativeBookingForm.jsx
    │   ├── QualificationStripSection.jsx
    │   └── FAQSection.jsx
    └── ui/
        ├── CalendlyEmbed.jsx
        └── spinner.jsx
```

### Steps

1. **Copy all 21 files** from Project Harmonizer — no modifications, verbatim.

2. **Delete the empty `src/pages/contractors3.tsx`** placeholder file (it's blank).

3. **Add route in `App.tsx`** — lazy-load outside any layout wrapper:
   ```tsx
   const Contractors3 = lazy(() => import("./pages/contractors3/Contractors3.tsx"));
   // Route: <Route path="/contractors3" element={<Contractors3 />} />
   ```

4. **Add scoped CSS to `src/index.css`** — Plus Jakarta Sans font import + `.contractors3-page` CSS variables scoped so they don't leak into the rest of the app:
   - `--background`, `--foreground`, `--card`, `--border`, etc. from Project Harmonizer's dark theme
   - Font family override within `.contractors3-page`

5. **Verify Tailwind config** — the `content` array already covers `./src/**/*.{ts,tsx}` but needs `js,jsx` added for these files.

### Dependencies
- `framer-motion` — already installed in this project
- `lucide-react` — already installed
- No new npm packages needed

### No modifications
Every component file is copied exactly as-is from the source project.
