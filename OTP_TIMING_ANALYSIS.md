# OTP Timing Analysis

## Timeline: OTP send → OTP entry UI appears

1. TruthGateFlow form submit → `phonePipeline.submitPhone()` → `send-otp` edge function → Twilio sends SMS
2. Lead row inserted, funnel.setPhone(e164, "otp_sent")
3. `onLeadCaptured(sessionId)` → `setLeadCaptured(true)` → UploadZone appears
4. User uploads file → `onScanStart(fileName, ssId)` → `setFileUploaded(true)`
5. ScanTheatrics begins:
   - Scanning phase: minimum 8 seconds (`addTimer(() => setScanningMinDone(true), 8000)`)
   - Plus actual scan-quote edge function time (AI analysis)
   - Cliffhanger phase: 2 seconds
   - Pillars phase: 5 seconds for grade reveal + 7 seconds for onRevealComplete
6. `gradeRevealed = true` → `shouldShowReport = true` → PostScanReportSwitcher renders
7. PostScanReportSwitcher creates `usePhonePipeline` with `externalPhoneE164: funnel.phoneE164`
8. `deriveGateMode("otp_sent", phoneE164)` → `"enter_code"` → LockedOverlay shows OTP input
9. User enters 6-digit code → `handleOtpSubmit()` → `pipeline.submitOtp(otpValue)`
10. `submitOtp` calls `verify-otp` with `{ phone_e164: activePhone, code, scan_session_id }`

## TOTAL TIME from send-otp to verify-otp:
- Minimum: 8s (scanning) + 2s (cliffhanger) + 7s (pillars+reveal) + file upload time + scan-quote time
- Realistic: 20-40+ seconds
- Twilio Verify default expiry: 10 minutes (600 seconds)
- **Timing is NOT the issue** — 20-40 seconds is well within the 10-minute window

## Phone value consistency:
- TruthGateFlow: `screenPhone(rawDigits)` → `toE164(digits10)` → `+1XXXXXXXXXX`
- Stored in funnel: `funnel.setPhone(normalizedE164, "otp_sent")` → localStorage
- PostScanReportSwitcher: `externalPhoneE164: funnel?.phoneE164` → same value
- `submitOtp`: `activePhone = options?.externalPhoneE164 || e164` → uses funnel value
- `verify-otp` receives: `{ phone_e164: activePhone }` → same E.164 value
- **Phone value is consistent** — same E.164 string at every stage

## Twilio SID consistency:
- send-otp: `Deno.env.get("TWILIO_VERIFY_SERVICE_SID")`
- verify-otp: `Deno.env.get("TWILIO_VERIFY_SERVICE_SID")`
- **Same env var name** — unless the edge functions have different env configs, same SID

## CRITICAL FINDING: send-otp inserts phone_verifications with NO lead_id
- `send-otp` line 65-68: `insert({ phone_e164, status: "pending" })` — no lead_id
- The lead row is created AFTER send-otp returns (TruthGateFlow line 237-248)
- So the phone_verifications row has `lead_id: null`
