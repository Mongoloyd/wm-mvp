

# P0 Migration + Remaining 9 Prompts Overview

## P0 — What Will Be Executed Now

Three additive migrations, zero destructive changes:

### Migration 1: voice_followups RLS (INSERT + UPDATE)
- Enable RLS (already enabled, idempotent)
- Add `internal_operators_insert_voice_followups` policy — WITH CHECK `is_internal_operator()`
- Add `internal_operators_update_voice_followups` policy — USING + WITH CHECK `is_internal_operator()`
- Both wrapped in `DO $$ ... IF NOT EXISTS ... $$` guards

### Migration 2: leads table — two new columns
- `manually_reviewed BOOLEAN NOT NULL DEFAULT false`
- `manual_entry_data JSONB` (nullable)
- Both use `ADD COLUMN IF NOT EXISTS`

### Migration 3: contractor_opportunities — sent_at
- `sent_at TIMESTAMP WITH TIME ZONE` (nullable)
- Uses `ADD COLUMN IF NOT EXISTS`

**Verified:** `is_internal_operator()` exists in the database (confirmed in DB functions). All target tables exist. No existing policies or columns will be touched.

---

## Remaining 9 Prompts — Verified State + Recommendations

### P1: Grade + Flag Badges (Frontend only)
**Score: 95.** `gradeColor()` already exists at line 39 of InternalCRMDesk.tsx. `lead.grade` and `lead.flag_count` are on `CRMLead`. No backend dependency. Clean to execute as-is.

### P2: Voice Status Badges
**Score: 82.** `fetch_voice_followups` action already exists in admin-data (line 95-99) and in the `AdminAction` type (line 45). The real work is adding the call to `AdminDashboard.fetchAll()` Promise.all (currently only fetches leads + webhook_deliveries). "Sent to Client" status should use `lead.latest_opportunity_id IS NOT NULL` since no contractor data is joined onto CRMLead.

**Recommendation:** Explicitly state that `fetchAll()` must add a third leg to its `Promise.all` for `fetch_voice_followups`.

### P3a: dial-lead Edge Function
**Score: 78.** The existing `voice-followup` function uses `PHONECALL_BOT_WEBHOOK_URL` (webhook, not REST). P3a must proxy through it, not call a speculative REST endpoint. The `voice_followups` INSERT requires NOT NULL columns: `lead_id`, `phone_e164`, `call_intent`, `provider`. The P0 migration adds the INSERT RLS policy needed.

**Recommendation:** Remove references to `PHONECALLBOT_API_KEY`/`PHONECALLBOT_AGENT_ID` from the secrets manifest — they don't exist. Use `PHONECALL_BOT_WEBHOOK_URL` via the existing `voice-followup` function.

### P3: Autodial Button
**Score: 85.** Clean frontend prompt if P3a is correct. Uses `lead.phone_e164` (correct field name). No issues.

### P4a: Add full_json to SELECT
**Score: 95.** One-line fix at line 298 of admin-data. Change `.select("grade, dollar_delta, confidence_score, flags")` → `.select("grade, dollar_delta, confidence_score, flags, full_json")`. Also needs `full_json: any` added to `LeadAnalysisData` in `src/components/admin/types.ts` (line 143-148).

### P4: Truth Engine Audit Panel
**Score: 80.** Depends on P4a. The `LeadDossierSheet` already fetches analysis via `fetchLeadAnalysis()` (line 94). After P4a, `full_json` will be available. The pillar_scores structure inside `full_json` is determined by the `scan-quote` edge function — the prompt correctly says "adapt if shape differs."

**Recommendation:** Add a temporary `console.log(data.full_json)` instruction so the builder can verify the actual shape before hardcoding access patterns.

### P5a + P5: Voice Call Log
**Score: 82.** P5a adds `fetch_lead_voice_followups` action (filtered by lead_id) — straightforward backend addition. P5 renders call history in the dossier. Field names are corrected: `call_outcome`, `transcript_text`, `call_intent`. Retry button must pass `{ action: 'trigger_voice_followup', scan_session_id, phone_e164, call_intent: 'retry_call' }` — not just `lead_id`.

### P6a + P6: Contractor Handoff
**Score: 78.** P6a creates `send-contractor-handoff` edge function. It correctly joins `analyses` via `latest_analysis_id` for `full_json`. Uses `RESEND_API_KEY` (exists). Needs `CONTRACTOR_EMAIL` and `CONTRACTOR_NAME` secrets added. P6a now owns the full `contractor_opportunities` upsert flow (uses P0's new `sent_at` column). P6 frontend delegates entirely to P6a — clean separation.

**Recommendation:** Verify `CONTRACTOR_EMAIL` and `CONTRACTOR_NAME` are added to Supabase secrets before running P6a.

### P7a + P7: Needs Review Queue
**Score: 75.** P7a uses two-query approach (no FK join needed). P7 references `rescan_lead` action which doesn't exist in admin-data — either P7a must add it, or P7 should invoke `scan-quote` directly. Quote image path goes through `scan_sessions` → `quote_files.storage_path`, not a field on `leads`.

**Recommendation:** P7a should explicitly add a `rescan_lead` action (or rename to call the existing `scan-quote` function). Also add `update_lead_manual_entry` action.

### P8 + P9: North Star KPI + Conversion Funnel
**Score: 92/93.** Both need `leads: CRMLead[]` added to `CommandCenterProps` (currently only `kpis` + `isLoading`). AdminDashboard line 215 must pass `leads={leads}`. Pure frontend derivation — no backend deps.

### P10: Attribution Tab
**Score: 95.** Cleanest prompt. Pure frontend derivation from `leads` array. All UTM fields exist on CRMLead. No issues.

---

## Recommended Execution Order

```text
NOW   → P0  (this migration)
NEXT  → P1  (frontend, zero deps)
THEN  → P4a (one-line backend fix)
      → P4  (Truth Engine audit, needs P4a)
      → P2  (voice badges, needs P0 RLS)
      → P5a → P5 (voice call log)
      → P3a → P3 (autodial — highest risk, save for after voice infra is proven)
      → P8 + P9 (KPI + funnel, independent)
      → P10 (attribution, independent)
      → P7a → P7 (needs review — most complex, save for last)
      → P6a → P6 (handoff — needs CONTRACTOR secrets added first)
```

This order front-loads the zero-risk visual wins (P1, P4, P2) and defers the highest-risk integrations (P3a autodial, P7 triage queue) until the foundational voice and analysis infrastructure is proven.

