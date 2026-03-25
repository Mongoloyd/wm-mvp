# Trusted Device OTP Convenience Plan

## Objective

Keep OTP fully active for normal users in the live funnel, but stop OTP from repeatedly blocking my own work on my personal computer while I build and test the rest of the system.

This is **not** a universal magic-code system.  
This is **not** a global OTP bypass.  
This is a **remember this browser/device after one real successful OTP** flow.

---

## Required Behavior

### Public users
- Public users must continue through the normal OTP flow.
- No changes to the real lead generation funnel for standard users.
- No reusable universal passcode.
- No front-end-only fake verification path.

### My personal browser / device
- After I complete one real OTP verification successfully on my own computer, the app should remember that browser as trusted.
- Future visits from that same browser on that same computer should skip the OTP step automatically while the trust window is still valid.
- Trust should last **30 days**.
- After 30 days, OTP should be required again once, then the trust window resets.

---

## Scope

Keep all existing core functionality unchanged:

- Lead creation
- Quote upload
- Scan session binding
- AI analysis
- Database writes
- Report generation
- Post-scan reveal flow

The only thing changing is the repeated OTP friction for my own browser after one legitimate verification.

---

## Implementation Rules

### Storage
Implement the trusted-device marker using either:

1. a secure cookie, preferred  
or  
2. localStorage, acceptable for now if faster to implement

For speed, localStorage is acceptable.

### Required stored values
Store both of the following after a successful real OTP verification:

- `wm_trusted_device = true`
- `wm_trusted_until = <ISO timestamp 30 days in the future>`

Example:

- `wm_trusted_device = "true"`
- `wm_trusted_until = "2026-04-24T18:30:00.000Z"`

---

## Frontend Behavior

### On OTP gate load
When the OTP gate/component/page loads:

1. Check whether `wm_trusted_device` exists
2. Check whether `wm_trusted_until` exists
3. Check whether the current date/time is still before `wm_trusted_until`
4. If valid:
   - skip rendering the OTP barrier
   - continue the normal reveal / unlock flow
5. If missing or expired:
   - show the normal OTP UI

### On successful OTP verification
When OTP succeeds through the real verification path:

1. Store the trusted-device values
2. Continue the normal success flow
3. Do not alter analysis/report behavior
4. Do not create a separate fake verified mode

---

## Reset / Testing Utility

Add a very simple manual way to clear the trusted device state for QA/testing.

Required utility:
- clear `wm_trusted_device`
- clear `wm_trusted_until`

This can be:
- a small hidden debug button
- a developer-only settings action
- or a simple utility function exposed in the browser console

The goal is to let me force the OTP screen back on when I need to test it again.

---

## Guardrails

### Must do
- Trust only the current browser/device storage
- Expire trust after 30 days
- Preserve existing OTP flow for everyone else
- Preserve existing backend verification and analysis behavior

### Must not do
- Do not create a universal passcode
- Do not create a hardcoded master OTP
- Do not create a permanent bypass that works from any browser or device
- Do not remove OTP from the public funnel
- Do not short-circuit quote analysis or report generation

---

## Desired UX Result

For me on my personal computer:
- I verify once
- the browser remembers me
- I can keep building without constant OTP interruptions
- the rest of the site and funnel behave normally

For public users:
- nothing changes
- OTP remains part of the lead-gen flow

---

## Plain-English Acceptance Criteria

This task is complete when all of the following are true:

1. I can successfully complete OTP once on my personal browser.
2. After that, revisiting the OTP-gated flow on that same browser skips the OTP step automatically.
3. The skip remains active for 30 days.
4. After 30 days, OTP is required again once.
5. Clearing the trusted-device marker forces the OTP screen to return immediately.
6. Public users still go through the normal OTP flow.
7. Quote analysis and report generation still run exactly as before.

---

## Preferred Implementation Style

Keep this implementation minimal and low-risk.

Do not refactor the broader auth system.  
Do not redesign the funnel.  
Do not modify unrelated components.  
Add the trusted-device logic only where necessary around the OTP gate / verification success flow.

---

## Final Instruction

Implement the smallest clean version of this remembered-device behavior so I can keep building the backend and redesigning the site without repeated OTP interruptions on my own computer, while preserving OTP as part of the live funnel for everyone else.
