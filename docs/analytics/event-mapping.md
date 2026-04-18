# Event Mapping — Scanner → OTP → Reveal (Arc 1)

This file is the source of truth for Arc 1 event value mapping on the live scanner path.

## Value ladder (required)

- `Lead` = `10`
- `SubmitApplication` = `250`
- `CompleteRegistration` = `500`
- `Schedule` = `1000`

All mapped values must include `currency: "USD"`.

## Canonical path mapping

| Business moment | Canonical event | Standard event | Value | Notes |
|---|---|---|---:|---|
| Lead captured | `wm_lead_submitted` | `Lead` | 10 | Lead signal only. |
| Upload confirmed success | `quote_upload_completed` | `SubmitApplication` | 250 | **Must fire only after** storage upload + lead/session creation + scan session creation all succeed. |
| OTP verified (legacy compatibility milestone) | `wm_otp_verified` | `CompleteRegistration` | 500 | Short-term legacy compatibility patch. |
| Contractor match requested | `wm_contractor_match_requested` | `Schedule` | 1000 | Highest-value CTA in this phase. |

## Upload success rule (strict)

`SubmitApplication` must never be emitted from:

- upload started
- file selected
- drag/drop initiated
- pre-success callback
- optimistic client state

It is valid only on confirmed upload success (all 3 backend-facing steps complete).

## CompleteRegistration meaning (compatibility vs canonical)

- **Immediate compatibility in Arc 1:** OTP success maps to `CompleteRegistration` with `value: 500` and `currency: "USD"`.
- **Canonical long-term meaning remains:** verified phone **and** unlocked full audit/reveal.

OTP success is a strong milestone, but long-term conversion semantics stay anchored to verified + unlocked report access.
