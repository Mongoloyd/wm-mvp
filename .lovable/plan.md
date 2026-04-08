

## Plan: Create B2B Contractor Intelligence Dossier Page

### What We're Building
A new standalone page at `/partner/dossier/:id` that fetches an analysis record (with joined lead data) from Supabase and renders a premium, dark-themed B2B intelligence dashboard with a mock paywall unlock mechanism.

### Files Changed

**1. CREATE `src/pages/PartnerDossier.tsx`**
- Full new page component with dark forensic aesthetic (navy/slate palette)
- Fetches `analyses` joined with `leads` via Supabase client using `useParams` ID
- Local `isUnlocked` state controls paywall blur on PII fields and document vault
- Four visual sections: Lead Provenance (blurred PII), Competitive Intelligence (grade + pricing), Sniper Strategy (flags as attack surface), Document Vault (locked/unlocked PDF)
- All deep access uses optional chaining + nullish coalescing for crash safety
- Pulsing "Unlock Lead (1 Credit)" button toggles unlock state

**2. MODIFY `src/App.tsx`**
- Add lazy import for `PartnerDossier`
- Add route `<Route path="/partner/dossier/:id" element={<PartnerDossier />} />` above the catch-all

### Enhancements (Thinking 2 Moves Ahead)

These are additions baked into the plan beyond the base spec:

- **Pillar score radar/bar visualization**: Render `full_json.pillar_scores` as a horizontal bar chart in a "Forensic Breakdown" card, giving contractors instant visual intel on where the competitor quote is weakest
- **County benchmark comparison strip**: If `full_json.extraction.total_quoted_price` and lead county exist, show a "vs. Market" indicator using the `county_benchmarks` table data (fetch inline)
- **Copy-to-clipboard on unlock**: When PII is revealed, add a small copy icon next to phone/email for quick CRM entry
- **Timestamp provenance footer**: Show when the scan was completed and rubric version used, establishing data freshness credibility

All enhancements stay within the single new file — no existing components or edge functions touched.

### Technical Details
- Supabase query: `supabase.from('analyses').select('*, leads(*)').eq('id', id).maybeSingle()` (using `maybeSingle` per project conventions to avoid crashes on missing rows)
- Type casting: The `leads` join returns as `any` since foreign keys aren't formally defined in the schema; all access is safely chained
- The `flags` field is `Json | null` — cast to array and map safely
- `full_json` accessed as `Record<string, any>` with defensive chaining throughout

