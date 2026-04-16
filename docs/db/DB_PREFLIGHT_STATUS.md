# DB Preflight Status — Phase 1 Hardening

**Date:** 2026-04-16
**Scope:** RLS policy audit, type generation workflow, FK reality, audit strategy, table access documentation

---

## VERIFIED

| File Read | Key Facts Confirmed |
|---|---|
| `supabase/config.toml` | 8 edge functions with `verify_jwt = false`: send-otp, verify-otp, generate-contractor-brief, contractor-actions, voice-followup, admin-data, dial-lead, send-contractor-handoff, dispatch-platform-events |
| `supabase/migrations/*` (69 files) | All tables have RLS enabled. All zero-policy tables were addressed in migration `20260416154937`. FK constraints confirmed for all 35 relationships in types.ts. |
| `src/integrations/supabase/types.ts` | 35 foreignKeyName entries, all corresponding to REFERENCES clauses in migrations. No concrete type mismatch found — file NOT modified. |
| `docs/db/TABLE_ACCESS_MODEL.md` | Existed from previous pass; rewritten with current policy state. |
| `docs/db/TYPEGEN_WORKFLOW.md` | Existed from previous pass; rewritten with exact required headings. |
| `docs/db/FK_HARDENING_PLAN.md` | Existed from previous pass; rewritten with per-relationship migration evidence. |
| `docs/db/AUDIT_STRATEGY.md` | Existed from previous pass; rewritten with explicit evidence citations. |
| `docs/architecture/` | Directory does not exist — no files to verify or correct. |
| `docs/backend/` | Directory does not exist — no files to verify or correct. |
| `package.json` | `typegen` and `typegen:check` scripts already present with correct values. No change needed. |

## CHANGED

Task A: No changes — all tables already have RLS policies (addressed in migration `20260416154937`). No tables with RLS enabled and zero policies remain.

Task B: No changes to `package.json` — scripts already match required keys exactly. `docs/db/TYPEGEN_WORKFLOW.md` rewritten with exact required section headings. `types.ts` not modified — no mismatch found.

Task C: No migration — all 35 FK relationships in types.ts are confirmed by migration evidence. `docs/db/FK_HARDENING_PLAN.md` rewritten with per-relationship verification. Option D chosen for 12 logical references not in types.ts.

Task D: No migration — no identical trigger/audit pattern exists in repo to mirror for the four target tables. `docs/db/AUDIT_STRATEGY.md` rewritten with deferred SQL. Option D chosen.

Task E: `docs/db/TABLE_ACCESS_MODEL.md` rewritten with full classification of all tables. No files in `docs/architecture/` or `docs/backend/` exist to correct.

## DEFERRED

| Item | Why Deferred | Unlock Condition | Document |
|---|---|---|---|
| `billable_intros` billing_status audit trigger | New trigger infrastructure with no identical precedent in codebase | Stripe auto-charge billing flow goes live | `docs/db/AUDIT_STRATEGY.md` (Tier 1) |
| `contractor_opportunities` + `contractor_opportunity_routes` routing audit | Same — new trigger infrastructure needed | Reclamation Engine feature | `docs/db/AUDIT_STRATEGY.md` (Tier 2) |
| `analyses` rubric versioning snapshots | Same — new trigger infrastructure needed | Rubric v2.0 major version bump | `docs/db/AUDIT_STRATEGY.md` (Tier 3) |
| `contractor_invitations.contractor_id` FK to `contractors.id` | Safe to add but deferred to avoid unnecessary migration churn | Next migration pass | `docs/db/FK_HARDENING_PLAN.md` |
| `leads.latest_*` FK constraints | Would require INSERT ordering changes in edge functions | Service layer refactor | `docs/db/FK_HARDENING_PLAN.md` |
| CI-level type-drift guard | Requires Supabase CLI in CI pipeline | CI pipeline enhancement | `docs/db/TYPEGEN_WORKFLOW.md` |

## INVARIANTS

These must never be changed:

| Invariant | Reason |
|---|---|
| `send-otp` and `verify-otp` edge functions | OTP hard gate — server-side Twilio Verify. Bypass would expose full_json to unverified users. |
| `supabase/functions/_shared/normalizePhone.ts` | US E.164 normalization used by OTP, lead matching, and phone verification. Changing format would break cross-table phone lookups. |
| `full_json` and `flags` columns on `analyses` | Report gate — `get_analysis_full` RPC returns these only after OTP verification. No policy may expose them directly. |
| `TruthReportClassic.tsx` | Canonical report component — consumes `get_analysis_full` output. Must remain the single source of truth for report rendering. |
| `get_analysis_full` RPC | Belt-and-suspenders authorization check: verifies BOTH `phone_verifications.status = 'verified'` AND `leads.phone_verified = true`. |
| `leads_anon_insert_constrained` policy | Prevents OTP gate bypass by enforcing `phone_verified = false` and null OTP fields on anonymous lead creation. |
