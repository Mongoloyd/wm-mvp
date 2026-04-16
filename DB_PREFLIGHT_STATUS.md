# DB Preflight Status — Phase 1 Hardening

**Date:** 2026-04-16  
**Scope:** Database schema, RLS, type generation, FK reality, audit strategy, repo-truth documentation

---

## A. RLS Hardening — ✅ COMPLETE

### What was verified
- All 30+ tables audited for RLS status and policy coverage
- 8 tables identified with RLS enabled but zero policies

### What was changed
| Table | Action | Rationale |
|-------|--------|-----------|
| `analyses` | Added service_role ALL + internal operator SELECT | RPC-only table, admin needs direct read |
| `contractor_opportunities` | Added service_role ALL + full internal operator CRUD | Admin dashboard table, matches `contractor_opportunity_routes` pattern |
| `county_benchmarks` | Added service_role ALL + public SELECT | Read-only reference data |
| `lead_events` | Added service_role ALL + internal operator SELECT | Admin audit trail read |
| `phone_verifications` | Added service_role ALL | Fully RPC/service-role gated |
| `quote_analyses` | Added service_role ALL | Legacy table |
| `quote_comparisons` | Added service_role ALL + internal operator SELECT | Edge function table |
| `service_tickets` | Added service_role ALL | Legacy/unrelated table |

### Critical security fix
- **`leads` anon INSERT**: Replaced unrestricted `WITH CHECK (true)` with constrained policy that enforces `phone_verified = false`, `phone_verified_at IS NULL`, `otp_state IS NULL`, `otp_failure_count = 0`. This prevents anonymous OTP gate bypass.
- **Deny policies**: Changed 3 PERMISSIVE deny policies (conversion_events, user_role_audit_log) to RESTRICTIVE so they actually block access.

### Function search_path fixes
- Fixed `set_updated_at`, `set_contractor_updated_at`, `log_contractor_pipeline_change`, `log_phone_verification_event` — all now have explicit `SET search_path = public`.

### Remaining linter warnings (intentional)
- `event_logs` anon INSERT `WITH CHECK (true)` — intentionally permissive for public analytics
- Leaked password protection — Supabase dashboard setting, not a code fix

---

## B. Type Generation — ✅ DOCUMENTED

### What was changed
- Added `typegen` and `typegen:check` scripts to `package.json`
- Created `docs/db/TYPEGEN_WORKFLOW.md` with exact regeneration steps

### What remains deferred
- CI-level type-drift guard (requires Supabase CLI in CI pipeline)
- Lovable auto-regenerates types after migration approval, covering the primary workflow

---

## C. FK / Relationship Reality — ✅ DOCUMENTED

### What was verified
- All `Relationships` arrays in `types.ts` cross-referenced against actual DB constraints
- 29 real FK constraints confirmed
- 12 logical references enforced by application logic only (documented)
- 5 SECURITY DEFINER functions providing join-level integrity (documented)

### What was changed
- None — no FK additions in this pass

### What remains deferred (with rationale)
- `leads.latest_*` columns: Denormalized pointers, FK would break INSERT ordering
- `lead_events` reference columns: Event tables should not have cascade-risk FKs
- `auth.users` references: Cannot FK to reserved schemas
- `contractor_invitations.contractor_id → contractors.id`: Safe to add, deferred to next pass
- Full plan in `docs/db/FK_HARDENING_PLAN.md`

---

## D. Row-History / Audit Strategy — ✅ DOCUMENTED

### What was verified
- 9 existing audit mechanisms cataloged (tables, triggers, functions)
- 5 tables identified as lacking durable mutation history

### What was changed
- None — audit triggers deferred to coordinate with dependent features

### What remains deferred (with rationale)
- **Tier 1**: `billable_intros` status audit — implement before billing goes to production
- **Tier 2**: `contractor_opportunities` + `contractor_opportunity_routes` routing audit — implement with Reclamation Engine
- **Tier 3**: `analyses` rubric versioning — implement with next major rubric bump
- Full plan in `docs/db/AUDIT_STRATEGY.md`

---

## E. Repo-Truth Documentation — ✅ COMPLETE

### What was created
| Document | Purpose |
|----------|---------|
| `docs/db/TABLE_ACCESS_MODEL.md` | Complete classification of every table's access pattern |
| `docs/db/TYPEGEN_WORKFLOW.md` | When/how to regenerate Supabase types |
| `docs/db/FK_HARDENING_PLAN.md` | FK audit with enforce/defer decisions |
| `docs/db/AUDIT_STRATEGY.md` | Row-history strategy for core business tables |
| `DB_PREFLIGHT_STATUS.md` | This file — summary of all Phase 1 hardening |

### Edge function inventory
- All 30 active edge functions documented with JWT requirement status
- `supabase/config.toml` entries verified against filesystem

---

## Acceptance Criteria Checklist

- [x] No live scanner, OTP, or reveal behavior weakened
- [x] RLS posture is clearer and less fragile (zero-policy tables eliminated)
- [x] Type generation workflow is explicit and reproducible
- [x] FK / relationship truth is documented honestly
- [x] Row-history strategy is no longer implicit
- [x] Docs match current backend/config reality
- [x] Critical OTP bypass vulnerability fixed (leads anon INSERT constrained)
- [x] PERMISSIVE deny no-ops fixed (converted to RESTRICTIVE)
- [x] Function search_path warnings resolved
