Forensic Noir design system and architecture constraints

## Forensic Noir Redesign (in progress)

### Completed (Phases 1-3)
- index.css: Full noir palette, obsidian bg (#0A0A0A), cobalt blue (#2563EB) primary, vivid orange (#F97316) danger
- tailwind.config.ts: borderRadius 0 everywhere, Barlow Condensed heading font, snap animations (0.15s)
- index.html: Barlow Condensed via Google Fonts
- main.tsx: @fontsource/barlow-condensed imports
- LinearHeader, AuditHero, TrustBullets, SocialProofStrip, ClosingManifesto, StickyCTAFooter: All noir
- IndustryTruth, ProcessSteps, NarrativeProof, MarketMakerManifesto, SampleGradeCard: All noir

### Remaining (Phase 4 — scan/report flow + supporting)
These still have old white/light styling and need noir treatment:
- TruthGateFlow.tsx — white bg, gold accents → obsidian bg, cobalt accents
- ScanTheatrics.tsx — navy #0F1F35 → obsidian #0A0A0A, cobalt/orange terminal
- TruthReport.tsx — white/light bg → obsidian surfaces
- GradeReveal.tsx — light bg → obsidian
- StickyRecoveryBar.tsx — white bg → obsidian
- ExitIntentModal.tsx — card bg → obsidian
- FlowBEntry.tsx — white bg → obsidian, green accents → cobalt
- ForensicChecklist.tsx — white/light → obsidian
- QuoteWatcher.tsx — navy → obsidian
- ContractorMatch.tsx — navy → obsidian
- EvidenceLocker.tsx — white → obsidian
- FlowCEntry.tsx — card bg → obsidian
- MarketBaselineTool.tsx — white → obsidian
- InteractiveDemoScan.tsx — uses semantic tokens (should auto-adapt)
- PowerToolDemo.tsx — already dark, minor tweaks
- ScamConcernImage.tsx — bg-background (should auto-adapt)

### Color mapping reference
- #FFFFFF / white → #0A0A0A (obsidian)
- #F9FAFB / #FAFAFA → #111111 (surface)
- #E5E7EB borders → #1A1A1A
- #0F1F35 navy → #0A0A0A
- #C8952A gold CTAs → #2563EB cobalt (gold only for logo)
- #0099BB cyan → #2563EB cobalt
- #059669 emerald CTAs → #2563EB cobalt
- Red flags → #F97316 vivid orange
- Text #0F1F35 → #E5E5E5
- Text #374151 → #6B7280
- Headlines: Barlow Condensed, uppercase, tight tracking
- Transitions: 0.15s snap, no springs

## Phase 1 Schema (completed)
- `quotes` bucket: private, 10MB limit, PDF/JPEG/PNG/WEBP/HEIC only
- New tables: `scan_sessions`, `analyses`, `phone_verifications`, `event_logs`
- `analyses` = canonical scoring table; `quote_analyses` = legacy (do not write to)
- `analyses` and `phone_verifications`: NO anon policies (service role only)
- `scan_sessions` and `event_logs`: temporary anon INSERT only
- All FKs use ON DELETE CASCADE (except event_logs.lead_id = SET NULL)
- `update_updated_at()` trigger on scan_sessions, analyses, phone_verifications
- scan_sessions.quote_file_id is UNIQUE (one session per upload)
- Status fields have CHECK constraints

## Security model
- full_json never sent to client before SMS verification
- No anon SELECT on analyses or phone_verifications
- Storage: no public URLs, signed URLs only via edge functions
- Existing leads/quote_files RLS is broad (temporary MVP) — tighten with auth in Phase 2

## RLS Hardening (2026-03-19)
- leads: dropped broad anon SELECT + UPDATE policies; replaced with `get_lead_by_session(p_session_id)` SECURITY DEFINER RPC
- leads: anon INSERT remains (WITH CHECK true) — acceptable for lead creation
- scan_sessions: tightened anon INSERT to `WITH CHECK (user_id IS NULL)` — prevents identity spoofing
- quote_files: dropped unnecessary anon SELECT policy — frontend only uses INSERT .select("id")
- event_logs: anon INSERT unchanged (telemetry, no sensitive data)
- analyses + phone_verifications: intentional deny-all (no policies, RLS on) — access via SECURITY DEFINER RPCs or service role only
- UploadZone.tsx updated to use `supabase.rpc("get_lead_by_session")` instead of direct table query
