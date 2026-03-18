# Routes & State Machine

## 1. Canonical Purpose
This document defines:
- route structure
- user flow states
- redirect logic
- access-level behavior

WindowMan must behave like a focused acquisition + protected-report system, not a wandering content site.

---

## 2. Primary User Flows

### Flow A — Has Quote
Entry:
- homepage CTA such as “Scan My Quote”

Path:
1. start lead/session
2. upload quote
3. analysis runs
4. proof-of-read / teaser shown
5. SMS OTP verification
6. full report reveal
7. optional contractor handoff request

### Flow B — No Quote Yet
Entry:
- “View Demo”
- “Create Free Account”
- “Get Ready for Quotes”

Path:
1. account / lead capture
2. optional demo
3. SMS verification if required by current flow design
4. empty dashboard / nurture state
5. future upload path

### Flow C — Returning User, No Quote
Path:
1. sign in
2. route to `/vault`
3. show empty state
4. prompt upload

### Flow D — Returning User, Has Quote
Path:
1. sign in
2. route to `/vault` or latest report
3. show prior scan/report access
4. allow new upload

---

## 3. Route Map

### Public routes
- `/`
- `/signin`
- `/signup`
- `/verify`
- `/demo`

### Authenticated routes
- `/vault`
- `/vault/upload`
- `/vault/reports/:reportId`

### Footer-only informational routes
- `/about`
- `/contact`
- `/faq`
- `/privacy`
- `/terms`
- `/disclaimer`

---

## 4. Header / Footer Navigation Rules
### Main header should stay minimal
Allowed:
- logo
- sign in
- create account
- dashboard / resume
- upload quote

### Do not place in main nav
- About
- Contact
- FAQ
- Privacy
- Terms
- Disclaimer

Those belong in the footer only.

---

## 5. Anonymous vs Authenticated vs Verified States

### Anonymous
Can:
- browse public pages
- start flow
- upload quote
- see teaser/proof-of-read

Cannot:
- access full report
- access verified-only data

### Authenticated but not phone-verified
Can:
- persist state
- enter `/vault`
- see report pending / teaser states

Cannot:
- access `full_json`
- open full report details

### Authenticated and phone-verified
Can:
- access full report routes
- reveal report details
- request contractor handoff

---

## 6. Redirect Logic
### Returning user rules
If user is authenticated:

#### Case 1 — pending scan exists and not verified
Redirect `/` to:
- `/verify`
or
- a pending report state that routes toward verification

#### Case 2 — verified user with prior scan/report
Redirect `/` to:
- `/vault`
or
- latest report route

#### Case 3 — authenticated user with no uploads
Redirect `/` to:
- `/vault`

Do not dump known returning users back onto the generic acquisition hero unless intentionally desired.

---

## 7. Route Guards
### `/vault`
Requires authenticated session.

### `/vault/upload`
Requires authenticated session.

### `/vault/reports/:reportId`
Requires:
- authenticated session
- ownership/authorization
- verified phone state for full report access

If not verified:
- redirect to `/verify`
- or show report pending / locked state only

---

## 8. Global State Concepts
At minimum, app state should be able to track:

- `userIntent`
- `leadId`
- `currentAnalysisId`
- `currentReportId`
- `authState`
- `phoneVerified`
- `analysisStatus`

### Suggested intent values
- `SCAN_NOW`
- `VIEW_DEMO`
- `GET_READY`
- `RETURNING`

### Suggested analysis statuses
- `idle`
- `uploading`
- `processing`
- `preview_ready`
- `awaiting_verification`
- `revealed`
- `invalid_document`
- `needs_better_upload`

---

## 9. Empty vs Populated Vault
### Empty state
If no scans exist:
- show upload CTA
- reinforce value
- offer demo/sample report if needed

### Populated state
If scans/reports exist:
- show report cards / summaries
- show last activity
- offer upload another quote

---

## 10. State Discipline Rules
### Required
- preserve lead/session continuity
- preserve upload progress when reasonable
- preserve pending verification state
- preserve returning-user routing logic

### Forbidden
- asking users to repeat already captured steps without reason
- losing the link between lead, upload, analysis, and report
- treating all authenticated users as equally authorized for full reveal

---

## 11. Minimal Route/State Checklist
Before route work is considered done:

- [ ] anonymous user can start the funnel
- [ ] returning user is routed intelligently
- [ ] full report routes are verification-gated
- [ ] empty vs populated vault states work
- [ ] pending verification users are not stranded
- [ ] header stays minimal and focused
