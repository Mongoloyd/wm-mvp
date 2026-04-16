

## Plan: Run Two SQL Migrations for CAPI Multi-Pixel Infrastructure

### Verified
The `supabase/functions/capi-event/index.ts` file already contains the updated production-grade code with multi-pixel routing, SHA-256 PII hashing, signal logging, and test_event_code support. No code changes needed.

### What Needs to Happen

**Migration 1 — `clients` + `meta_configurations` tables**
- `clients`: stores client slugs for multi-pixel routing
- `meta_configurations`: stores pixel_id, access_token, test_event_code per client
- Unique partial index ensures only one default pixel config exists
- RLS enabled on both tables (service_role access for edge function usage)

**Migration 2 — `capi_signal_logs` table**
- Stores every CAPI event fired: client_slug, pixel_id, event_name, status_code, payload (already hashed), response
- Index on `(client_slug, fired_at desc)` for admin dashboard queries
- RLS enabled (service_role access for edge function writes, internal operator reads)

### RLS Policies
Both migrations will include RLS policies:
- `service_role` gets full access (edge functions use service_role key)
- `is_internal_operator()` gets SELECT access for admin dashboard viewing

### Files Modified
None — database migrations only.

