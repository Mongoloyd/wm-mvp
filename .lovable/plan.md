

## Phase 3, 4, 5: Full Code Migration, Cleanup, and Database Wiring

### Overview
Migrate all 29 components, 1 hook, 1 utility module, and 6 image assets from the source project into this production environment. Create the database tables (none exist yet), wire lead capture and file upload to live Supabase, and apply the Forensic Cool design system.

---

### Phase 1 (Prerequisite): Database Setup
The database tables do not exist yet. Before wiring the code, we must run a SQL migration to create:

1. **`leads`** table with RLS (anon INSERT + SELECT by session_id)
2. **`quote_files`** table with FK to leads, RLS (anon INSERT)
3. **`quote_analyses`** table with FK to leads, RLS (anon SELECT)
4. **`quotes` storage bucket** with anon upload/download policies

### Phase 2 (Prerequisite): Install Dependencies
- `framer-motion`
- `@fontsource/dm-mono`, `@fontsource/dm-sans`
- `embla-carousel-react` (used by EvidenceCarousel)

### Phase 3: Migrate Source Code

**Components to create (29 files in `src/components/`):**
- AuditHero, LinearHeader, SocialProofStrip, ScamConcernImage
- TruthGateFlow, UploadZone, ScanTheatrics, GradeReveal
- ContractorMatch, EvidenceLocker
- FlowBEntry, FlowCEntry, MarketBaselineTool, ForensicChecklist, QuoteWatcher
- IndustryTruth, ProcessSteps, NarrativeProof, ClosingManifesto, MarketMakerManifesto
- StickyRecoveryBar, InteractiveDemoScan, ExitIntentModal
- EvidenceCarousel, EvidenceImage, EvidenceLightbox
- PowerToolDemo

**Hook & Utility:**
- `src/hooks/usePhoneInput.ts`
- `src/utils/formatPhone.ts`

**Assets (copy via cross_project--copy_project_asset):**
- `src/assets/forensic-analysis-report.avif`
- `src/assets/hand-scanner-hero.webp`
- `src/assets/hidden-contract-terms.avif`
- `src/assets/noa-letter.avif`
- `src/assets/scam-concern.avif`
- `src/assets/windowman-truth.avif`

**Index.tsx:** Replace placeholder with the full flow state manager from the source.

### Phase 4: Code Cleanup

- The current project's `.env` and `supabase/config.toml` already point to `wkrcyxcnzhwjtdpmfpaf` -- no scrubbing needed
- The source code has no hardcoded references to `hawgcpcm` in component files (only in `.env` and `config.toml` which we won't copy)
- `src/integrations/supabase/client.ts` already uses env vars correctly
- Remove the `#root` max-width/padding/text-align from `App.css` so the full-width components render properly

### Phase 5: Wire Up Live Database

**TruthGateFlow.handleSubmit (line ~217-233):**
- Replace `console.log(payload)` + fake delay with:
```typescript
const sessionId = crypto.randomUUID();
await supabase.from('leads').insert({
  session_id: sessionId,
  first_name: answers.firstName,
  email: answers.email,
  phone_e164: phoneInput.e164,
  county: answers.county,
  project_type: answers.projectType,
  window_count: parseWindowCount(answers.windowCount),
  quote_range: answers.quoteRange,
  source: 'truth-gate',
});
```

**MarketBaselineTool.handleSubmit (line ~235-277):**
- Same pattern, insert into `leads` with `source: 'market-baseline'`

**UploadZone.handleScan:**
- Upload file to Supabase Storage `quotes` bucket
- Insert record into `quote_files` with lead_id and storage_path

**Index.tsx:**
- Set `IS_DEV_MODE = false`
- Store session_id in state, pass to child components
- Replace `mockAuditResult` usage: for now keep mock data (real analysis requires an edge function), but store session_id for future `quote_analyses` lookup

**Console.log cleanup across all components:**
- Replace `console.log({ event: ... })` tracking calls with `supabase.from('leads').update()` where appropriate (e.g., updating lead status)
- Keep non-critical console.log tracking as-is for now (e.g., UI interaction events) -- these can be wired to an analytics edge function later

### Design System Update (index.css)

Add the source project's custom CSS variables to `:root`:
```css
--color-navy: 210 25% 10%;
--color-amber: 38 92% 50%;
--color-cyan: 187 100% 50%;
--color-emerald: 160 84% 39%;
--color-danger: 0 79% 43%;
/* ... plus all light variants and text variants */
```

Add corresponding Tailwind config entries for `navy`, `gold`, `cyan`, `emerald`, `danger` colors used by InteractiveDemoScan, ExitIntentModal, and FlowCEntry.

---

### Execution Order
1. Run SQL migration (tables + storage bucket)
2. Install npm dependencies
3. Copy all 6 image assets
4. Create utility files (formatPhone, usePhoneInput)
5. Create all 29 components (no database changes, just file creation)
6. Replace Index.tsx and update App.css
7. Update index.css with design system variables
8. Update tailwind.config.ts with custom colors
9. Wire TruthGateFlow + MarketBaselineTool + UploadZone to Supabase
10. Set IS_DEV_MODE = false

### Notes
- PowerToolDemo.tsx uses `@ts-nocheck` -- will preserve that
- GradeReveal still uses mock data since real analysis requires an edge function (Phase 2 follow-up)
- All `console.log` event tracking will be preserved as-is for non-lead-capture events; only lead capture and file upload get wired to the database
