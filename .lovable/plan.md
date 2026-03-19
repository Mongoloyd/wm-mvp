

# Security Audit: RLS Policy Review

## Current State Summary

| Table | INSERT | SELECT | UPDATE | DELETE | Risk Level |
|-------|--------|--------|--------|--------|------------|
| **leads** | anon: `true` | anon: `true` | anon: `true` + `true` | blocked | **HIGH** |
| **scan_sessions** | anon: `true` | blocked (RPC only) | blocked | blocked | MEDIUM |
| **event_logs** | anon: `true` | blocked | blocked | blocked | LOW |
| **quote_files** | anon: `true` | anon: `true` | blocked | blocked | MEDIUM |
| **analyses** | blocked | blocked (RPC only) | blocked | blocked | OK |
| **phone_verifications** | blocked | blocked | blocked | blocked | OK |

---

## Finding 1: `leads` — CRITICAL

**Problem**: All three anon policies use `USING (true)` / `WITH CHECK (true)`. Any anonymous client can:
- Read every lead in the system (names, emails, phone numbers)
- Update any lead's data (change email, phone, name)
- Enumerate all leads via `.select("*")`

This is a data breach vector. The `leads` table contains PII (name, email, phone_e164).

**Fix**: Scope policies to `session_id` ownership. The frontend already passes a `session_id` (a `crypto.randomUUID()` stored client-side). Policies should restrict access to rows matching that session:

```sql
-- DROP existing broad policies
DROP POLICY "Allow anonymous select own leads by session_id" ON public.leads;
DROP POLICY "Allow anonymous update own leads" ON public.leads;

-- Scoped SELECT: anon can only read leads matching their session header
CREATE POLICY "anon_select_own_leads"
  ON public.leads FOR SELECT TO anon
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id');

-- Scoped UPDATE: anon can only update their own lead
CREATE POLICY "anon_update_own_leads"
  ON public.leads FOR UPDATE TO anon
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id')
  WITH CHECK (session_id = current_setting('request.headers', true)::json->>'x-session-id');
```

**Alternative (simpler, MVP-safe)**: Since the frontend only queries leads by `session_id` anyway, a lighter approach uses the session_id directly in the policy without custom headers — but Supabase anon role has no built-in session concept, so the header approach or an RPC (like we did for scan_sessions) is needed.

**Recommended MVP approach**: Replace the broad SELECT/UPDATE with a `SECURITY DEFINER` RPC that accepts `session_id` as a parameter and returns only matching rows. This mirrors the pattern already used for `get_scan_status` and `get_analysis_preview`.

---

## Finding 2: `scan_sessions` anon INSERT — LOW RISK

**Problem**: `WITH CHECK (true)` means any anon user can insert arbitrary rows, including fake `lead_id` or `user_id` values pointing to other users' data.

**Current mitigation**: The table has no anon SELECT/UPDATE/DELETE, so inserted rows can't be read back directly (only via `get_scan_status` RPC). However, an attacker could:
- Spam the table with junk rows (no rate limiting at DB level)
- Link a scan_session to someone else's `lead_id`

**Fix**: Constrain the INSERT to only allow null `user_id` for anon, and validate `lead_id` ownership:

```sql
DROP POLICY "anon_insert_scan_sessions" ON public.scan_sessions;
CREATE POLICY "anon_insert_scan_sessions"
  ON public.scan_sessions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
```

This prevents anon users from claiming a `user_id` they don't own. The `lead_id` linkage is harder to validate at the DB level without a session concept, but ensuring `user_id IS NULL` is a meaningful improvement.

---

## Finding 3: `quote_files` anon SELECT — MEDIUM RISK

**Problem**: Any anon user can `SELECT *` from `quote_files`, exposing all `storage_path` values. While the storage bucket is private (no public URLs), knowing the paths could be useful for targeted attacks if a signed-URL endpoint is later added carelessly.

**Fix**: Same pattern — either scope to session ownership via RPC, or remove the anon SELECT entirely if the frontend doesn't need it (check usage).

The frontend only inserts into `quote_files` and reads the `id` back via `.select("id").single()` on the insert response. It never does a standalone SELECT on `quote_files`. So the anon SELECT policy can be **dropped entirely**.

```sql
DROP POLICY "Allow anonymous select on quote_files" ON public.quote_files;
```

---

## Finding 4: `event_logs` anon INSERT — LOW RISK (acceptable)

Anon INSERT with `WITH CHECK (true)` for telemetry/analytics is standard. The table contains no sensitive data and has no SELECT policy. No change needed, but adding a column constraint like `user_id IS NULL` for anon would be a minor hardening.

---

## Finding 5: Storage — OK

The `quotes` bucket is private, anon SELECT was already dropped, and only blind uploads remain. This is correct for the MVP.

---

## Implementation Plan

### Step 1: Drop broad `leads` SELECT/UPDATE policies
Replace with a `SECURITY DEFINER` RPC `get_lead_by_session(p_session_id text)` that returns only the matching lead row. Update frontend code in `UploadZone.tsx` (line 53) to use the RPC instead of `.from("leads").select("id").eq("session_id", ...)`.

### Step 2: Tighten `scan_sessions` INSERT
Add `WITH CHECK (user_id IS NULL)` so anon can't claim authenticated identity.

### Step 3: Drop `quote_files` anon SELECT
Not used by the frontend; remove the unnecessary exposure.

### Step 4: Update frontend code
- Replace direct `leads` queries with the new RPC
- Verify no other direct `leads` SELECT/UPDATE calls exist

### Step 5: Update memory/docs
Record the tightened policies in the security model doc and memory index.

---

## Priority

| Step | Severity | Effort |
|------|----------|--------|
| 1 (leads) | **Critical** — PII exposure | Medium |
| 2 (scan_sessions) | Low | Small |
| 3 (quote_files) | Medium | Trivial |
| 4 (frontend) | Required by Step 1 | Small |
| 5 (docs) | Housekeeping | Trivial |

