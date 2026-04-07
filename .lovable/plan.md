

# Surface Twilio Error 60410 in send-otp Response

## Change

In `supabase/functions/send-otp/index.ts`, replace the generic "Failed to send verification code" error response with logic that checks for specific Twilio error codes and returns a descriptive message.

### File: `supabase/functions/send-otp/index.ts`

After the `const twilioData = await twilioRes.json();` block, update the error handling (~line 131-135) to:

1. Check `twilioData.code === 60410` — return "This phone number prefix has been temporarily blocked by our carrier. Please try a different number."
2. Check `twilioData.code === 60203` — return "Too many verification attempts. Please wait before trying again."
3. Default — keep "Failed to send verification code."

Single block change, ~10 lines. No other files affected.

