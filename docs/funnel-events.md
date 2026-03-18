# Funnel Events & Conversion Taxonomy

## 1. Canonical Purpose
This document defines:
1. event taxonomy
2. lead-state progression
3. optimization guidance

WindowMan should optimize for **verified quote-owner behavior**, not vanity lead volume.

---

## 2. Event Taxonomy
These are the core product and funnel events.

### Acquisition / intent
- `page_view`
- `cta_click`
- `path_selected`

### Lead creation / setup
- `lead_started`
- `lead_completed` (optional if used)
- `account_created` (optional if tracked separately)

### Upload / scan
- `upload_started`
- `upload_completed`
- `proof_of_read_shown`
- `teaser_viewed`

### Verification
- `otp_started`
- `otp_sent`
- `otp_verified`

### Report / monetization
- `report_revealed`
- `contractor_match_requested`
- `qualified_lead`

Keep event names stable once adopted.

---

## 3. Required Event Payload Fields
At minimum, most events should support:

- `session_id`
- `lead_id` (when available)
- `user_id` (when available)
- `flow_type`
- `route`
- `timestamp`

### Attribution fields
When available:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `gclid`
- `fbclid`

### Flow values
Recommended:
- `A` = has quote
- `B` = no quote / baseline / demo
- `C` = returning no-quote
- `D` = returning with quote

---

## 4. Lead State Lifecycle
This is the internal lifecycle model. It is separate from event names.

Recommended statuses:
- `NEW`
- `PENDING_UPLOAD`
- `PENDING_ANALYSIS`
- `PENDING_VERIFICATION`
- `VERIFIED`
- `REPORT_REVEALED`
- `HANDOFF_READY`
- `CLOSED_LOOP` (optional later)

### Definitions
- `PENDING_UPLOAD`: lead exists, no quote uploaded yet
- `PENDING_ANALYSIS`: upload received, analysis not complete yet
- `PENDING_VERIFICATION`: teaser available, full report still locked
- `VERIFIED`: user cleared SMS OTP
- `REPORT_REVEALED`: full report accessed
- `HANDOFF_READY`: user requested better quote / contractor action

---

## 5. Optimization Guidance
Do not confuse all events with equal optimization value.

### Highest-value behavioral signals
1. `contractor_match_requested`
2. `report_revealed`
3. `otp_verified`
4. `upload_completed`

### Lower-value but still useful signals
- `lead_started`
- `cta_click`
- `page_view`

### Rule
Ad platforms should eventually optimize toward high-intent downstream events, not just shallow form starts.

---

## 6. Important Distinction
This file is **not** the place to finalize ad-platform value mapping.

Do not hard-code media-buying value assignments here unless intentionally versioned later.

Examples that belong elsewhere:
- Meta value-based bidding dollar values
- offline appointment value rules
- CRM close-value mapping

Those can live in a later measurement or attribution doc.

---

## 7. Event Quality Rules
### Required
- fire events once per actual action
- deduplicate where needed
- maintain stable naming
- preserve linkage between session, lead, user, and report when possible

### Forbidden
- duplicate `report_revealed` on every re-render
- inflate `qualified_lead` without true qualification logic
- optimize on events that do not reflect real business value

---

## 8. Qualification Note
`qualified_lead` should be reserved for a real threshold such as:
- homeowner
- sufficient project size
- meaningful timeline / intent
- verified identity
- optionally uploaded quote or explicit contractor-match request

Do not use `qualified_lead` as a synonym for any contact capture.

---

## 9. Minimal Instrumentation Checklist
Before analytics is considered usable:

- [ ] `lead_id` persists across major funnel steps
- [ ] upload events are captured
- [ ] OTP events are captured
- [ ] report reveal events are captured
- [ ] attribution fields are stored when available
- [ ] lifecycle states can be reconstructed from event data
