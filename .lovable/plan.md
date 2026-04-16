

## QA Findings and Fix Plan: AdminPartners Page

### Critical Bug Found: Double-Protocol in Copy URL

**Line 294** in `LandingPageUrl` component:
```ts
const fullUrl = `https://${url}`;
```

But `url` is already built from `window.location.origin` (line 203), which includes the protocol (e.g., `https://wmmvp.lovable.app/lp/test`). The copy button currently produces:

```
https://https://wmmvp.lovable.app/lp/test
```

This is a broken URL. The fix is to remove the `https://` prefix on line 294.

### Database State

- **`test` client exists** (slug: `test`, active: `true`) but has **no `meta_configurations` row** — no pixel ID or access token. The edge function correctly returns "CAPI not configured" for this client.
- To complete an E2E signal log test, pixel credentials must be added via the UI modal or directly in the DB.

### Other Observations

- **No Delete flow exists.** The UI has no delete button for clients. The prompt's "Delete" test cases are not applicable to current implementation.
- **No Update/Edit for slug** after creation — `slugify()` is applied on change, but the slug field is editable in edit mode (which is fine, just noting).
- **Signal Log Realtime** subscription is correctly wired via `postgres_changes` on `capi_signal_logs` INSERT events.
- **Filtering** works by `client_slug` match; the "Default Pixel" filter checks for `null` client_slug, which is correct.
- **AuthGuard** wraps the page; unauthorized access redirects as expected.

### Plan

**Step 1 — Fix the double-protocol bug** in `LandingPageUrl`:
- Change line 294 from `const fullUrl = \`https://${url}\`;` to `const fullUrl = url;` since `url` already contains the full origin with protocol.

**Step 2 — Seed test pixel config (optional, for E2E verification)**
- If you want to complete the signal log E2E test, add a `meta_configurations` row for the `test` client with a valid Meta Pixel ID and CAPI access token via the UI modal.

### No other code changes needed
The CRUD (create/update), signal log realtime, filtering, and copy URL logic are all correctly implemented aside from the double-protocol bug.

