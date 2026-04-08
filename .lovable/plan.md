

## Fix Admin Page Sync Jank

### Problem
The `/admin` page fires 4 edge function calls every 30 seconds and shows a pulsing "Syncing…" badge each time. With ~15 leads and cold-start latency on each edge function, this creates a perception of constant loading even though the page is fully usable.

### Changes (1 file: `src/components/AdminDashboard.tsx`)

#### 1. Increase polling interval
Change `REFRESH_INTERVAL_MS` from `30_000` (30s) to `120_000` (2 min). With <20 leads, 2-minute refresh is more than sufficient.

#### 2. Hide "Syncing…" badge on background refreshes
Track whether this is the initial load vs a background poll. Only show "Syncing…" on the first fetch. Background refreshes happen silently — the data just updates in place.

Add an `initialLoadDone` ref. On first fetch, show the badge. On subsequent polls, set `isSyncing` to `false` so no visual indicator appears.

#### 3. Stagger non-critical fetches
Split the `Promise.all` into two tiers:
- **Tier 1 (immediate)**: `fetch_leads` — this is the primary dataset, fetch it first and render
- **Tier 2 (deferred)**: `fetch_webhook_deliveries`, `fetch_voice_followups`, `fetch_needs_review` — fetch after leads arrive, don't block the main render

This means leads render ~1s faster on initial load.

#### 4. Show last-synced timestamp instead of pulsing badge
Replace the pulsing "Syncing…" badge with a subtle static timestamp like "Updated 2m ago" near the lead count. This communicates freshness without anxiety.

### Technical Detail

```text
Before:
  mount → [Syncing…] → 4 parallel edge calls → render
  +30s  → [Syncing…] → 4 parallel edge calls → re-render
  +60s  → [Syncing…] → 4 parallel edge calls → re-render
  ...

After:
  mount → fetch_leads → render immediately
        → fetch_webhooks + followups + needs_review (background)
  +2min → silent background refresh (no badge)
  +4min → silent background refresh
  ...
```

### What stays the same
- All 4 data sources still fetched
- `isLoading=false` on mount (instant first paint)
- No backend/edge function changes
- No auth changes

