# Security & Identity Model

## 1. Canonical Purpose
WindowMan.PRO is a verify-to-reveal system.

The platform must protect:
- uploaded quote files
- extracted quote data
- full Truth Report payloads
- contractor-sensitive intelligence
- identity-linked report access

Security must be enforced server-side, not cosmetically in the frontend.

---

## 2. Identity Ladder
The Identity Ladder is a core moat.

### Level 0 — Anonymous
Allowed:
- visit public pages
- upload quote
- trigger OCR / scan processing
- see proof-of-read
- see teaser / locked preview

Blocked:
- full Truth Report
- exact score details
- full red flags
- contractor-sensitive intelligence

### Level 1 — Account / Email Session
Allowed:
- account/session persistence
- access to `/vault`
- scan history list if permitted
- report pending state
- teaser state

Blocked:
- full Truth Report payload

### Level 2 — SMS OTP Verified
Required for:
- fetching `full_json`
- viewing full Truth Report
- exact pillar breakdown
- detailed red flags
- contractor handoff request

### Hard rule
The backend must check verified state such as:
- `profiles.phone_verified_at != null`

before returning full report data.

---

## 3. Full Report Withholding Rule
This is non-negotiable.

### Forbidden
Do not:
- preload `full_json` into the browser before verification
- hide full report data behind CSS blur
- rely on client-only conditionals for sensitive access
- ship data that appears in the Network tab before authorization

### Required
Sensitive report payloads must be withheld server-side until Level 2 access is confirmed.

If the browser can inspect the full report before SMS verification, security has failed.

---

## 4. Supabase Auth Model
Use Supabase Auth for account/session handling.

Recommended profile linkage:
- `profiles.user_id` references `auth.users.id`
- create profile row automatically when auth user is created

Auth should support:
- account persistence
- resumable state
- clean linkage between user, lead, uploads, analyses, and reports

Email auth may exist for account continuity, but **must not** unlock the full report by itself.

---

## 5. Twilio Verify Model
Use Twilio Verify for the SMS hard gate.

### Implementation rules
- Twilio secrets remain backend-only
- OTP logic must run through secure backend handlers / edge functions
- no Twilio secrets in the client

### Recommended functions
- `send-otp`
- `verify-otp`

### Verification result
Successful OTP verification should update trusted backend state such as:
- `profiles.phone_verified_at`
- `phone_verifications.status = verified`

---

## 6. Supabase Storage Rules
All uploaded quotes must live in private storage.

### Bucket policy
- use private bucket(s), such as `quote-uploads`
- no public direct file URLs
- access through short-lived signed URLs only when needed

### File organization
Prefer paths linked to user/session context, e.g.:
- `user_id/...`
- `lead_id/...`
- `analysis_id/...`

### Rule
Never treat uploaded quote files like public marketing assets.

---

## 7. Row Level Security (RLS)
Enable RLS on all user-linked tables.

At minimum protect:
- `profiles`
- `leads`
- `quote_uploads`
- `scan_sessions`
- `analyses`
- `reports`
- `phone_verifications`
- `contractor_handoffs`

### Principle
Users may only read/write rows tied to their own authenticated identity unless an explicitly elevated internal role is granted.

### Important
Do not weaken RLS temporarily “just to get the UI working.”

---

## 8. Anonymous / Pre-Auth Lead Capture
Anonymous users may need to:
- start a lead
- upload a quote
- enter the scanner funnel

That is acceptable only if it is controlled.

### Requirements
- rate limit anonymous creation paths
- store enough session linkage to reconcile anon actions to later auth user
- do not expose existing user/report data to anon sessions

---

## 9. Route Guard Rules
### Public routes
- `/`
- `/signin`
- `/signup`
- `/verify`
- `/demo`

### Protected routes
- `/vault`
- `/vault/upload`
- `/vault/reports/:reportId`

### Verification guard
Any request for full report views must check verified state.
If not verified:
- redirect to `/verify`
- or return safe teaser/report-pending state only

---

## 10. Resumable Security State
The system must support partial progression without leaking data.

Examples:
- uploaded but not verified
- account created but no phone verification
- returning user with pending report

### Rule
A returning user may resume their journey, but must still satisfy the proper access level before seeing sensitive report data.

---

## 11. Logging and Audit
Log important security-relevant transitions:
- OTP sent
- OTP verified
- report revealed
- suspicious repeated OTP attempts
- failed verification bursts

Do not log secrets or sensitive raw token values.

---

## 12. Security Checklist
Before any auth/report feature is considered done:

- [ ] `full_json` is backend-gated
- [ ] quote files are private
- [ ] signed URL access is time-limited
- [ ] Twilio secrets are backend-only
- [ ] RLS is enabled on relevant tables
- [ ] Level 2 verification is required for full report access
- [ ] returning users cannot bypass verification rules
