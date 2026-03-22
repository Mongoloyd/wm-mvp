# Facebook Conversion Architecture

## Overview

WindowMan's conversion tracking is built for maximum Facebook ad optimization. Every funnel touchpoint fires both browser-side (Meta Pixel) and server-side (Conversions API) events, deduplicated by `event_id`.

## Conversion Funnel Events

| Funnel Stage | Standard Event | Custom Event | Optimization Signal |
|---|---|---|---|
| Page Load | `PageView` | `wm_page_view` | Reach/Frequency |
| Step 2 Complete | `ViewContent` | `wm_shadow_created` | Abandonment audience seed |
| County Selected | — | `wm_county_identified` | Geo-targeted retargeting |
| Step 4 Answered | — | `wm_flow_routed` | Flow-specific retargeting |
| Quote Uploaded | `AddToCart` | `wm_upload_started` | High-intent signal |
| Lead Captured | `Lead` | `wm_lead_submitted` | Primary optimization event |
| OTP Verified | `CompleteRegistration` | `wm_otp_verified` | Highest-quality signal |
| Report Unlocked | — | `wm_report_unlocked` | Engagement depth |
| Grade Revealed | — | `wm_grade_revealed` | Content consumption |
| Grade D/F | — | `wm_grade_critical` | Contractor match intent |
| Contractor Match | `Schedule` | `wm_contractor_match_requested` | Revenue event |

## Deduplication Strategy

```
Browser Pixel (fbq)  ──┐
                        ├── Same event_id ──→ Meta counts ONCE
Server CAPI            ──┘
```

- Browser fires immediately (low latency, works when pixel loads)
- CAPI fires from Supabase edge function (survives iOS ITP, ad blockers)
- Both share the same `event_id` generated client-side
- Meta automatically deduplicates: same event_id = counted once

## Retargeting Audiences

### Shadow Abandonment (Highest ROAS)
- **Include:** `wm_shadow_created` (Step 2+ completion)
- **Exclude:** `Lead` (standard Meta event)
- **Result:** People who started but didn't finish
- **Expected CPM:** $12–18 vs $28–40 cold

### County-Specific Abandonment
- **Include:** `wm_county_identified`
- **Exclude:** `Lead`
- **Copy:** "You started your {County} County audit..."

### Grade D/F Re-engagement
- **Include:** `wm_grade_critical`
- **Exclude:** `wm_contractor_match_requested`
- **Copy:** "Your quote got an F. Here's what to do."

### Verified Leads (Lookalike Seed)
- **Source:** `wm_otp_verified`
- **Use:** 1% lookalike for prospecting

## Attribution Chain

```
Facebook Ad Click
  → fbclid in URL
  → _fbc cookie (fb.1.{timestamp}.{fbclid})
  → wm_lead_id (persistent UUID in localStorage + cookie)
  → UTM params captured to localStorage
  → All events tagged with lead_id + fbc + fbp
  → CAPI sends hashed PII (em, ph) + external_id
  → Supabase leads table stores full attribution
```

## Environment Variables

### Client-side (Vite)
- `VITE_META_PIXEL_ID` — Your Meta Pixel ID

### Server-side (Supabase secrets)
- `META_PIXEL_ID` — Same pixel ID
- `META_CAPI_TOKEN` — Conversions API access token

## Setup Checklist

1. [ ] Set `VITE_META_PIXEL_ID` in `.env`
2. [ ] Set `META_PIXEL_ID` and `META_CAPI_TOKEN` via `supabase secrets set`
3. [ ] Deploy `capi-event` edge function
4. [ ] Verify pixel fires in Facebook Events Manager
5. [ ] Test CAPI events with test event code
6. [ ] Set up custom conversions in Events Manager
7. [ ] Build retargeting audiences
8. [ ] Configure campaign optimization for `Lead` event
9. [ ] Add `fb:app_id` to index.html OG tags
10. [ ] Add Facebook domain verification meta tag
