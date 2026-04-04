

# Fix: Database Trigger Column Mismatch Crashing OTP Inserts

## Root Cause

The `send-otp` Edge Function insert is correct — it uses `phone_e164`. The crash originates from a **PostgreSQL trigger function** `log_phone_verification_event()` attached to the `phone_verifications` table. This trigger references `NEW.phone_number`, which does not exist. Postgres error `42703` fires on every insert attempt.

From the DB functions dump:
```sql
phone_masked := 'xxx-xxx-' || RIGHT(NEW.phone_number, 4);
-- should be:
phone_masked := 'xxx-xxx-' || RIGHT(NEW.phone_e164, 4);
```

The trigger also references `NEW.verified` but the table uses a `status` column (text), not a boolean `verified` column.

## Fix (Single Migration)

Run one SQL migration that replaces the trigger function, fixing all column references:

```sql
CREATE OR REPLACE FUNCTION public.log_phone_verification_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phone_masked TEXT;
BEGIN
  phone_masked := 'xxx-xxx-' || RIGHT(NEW.phone_e164, 4);

  IF (TG_OP = 'INSERT') THEN
    RAISE LOG '[OTP:DB:VERIFICATION_CREATED] {"phone": "%", "status": "%", "timestamp": "%"}',
      phone_masked, NEW.status, NOW();

  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.status = 'verified' AND OLD.status = 'pending') THEN
      RAISE LOG '[OTP:DB:VERIFICATION_SUCCESS] {"phone": "%", "lead_id": "%", "timestamp": "%"}',
        phone_masked, NEW.lead_id, NOW();
    ELSIF (NEW.status = 'expired' AND OLD.status = 'pending') THEN
      RAISE LOG '[OTP:DB:VERIFICATION_EXPIRED] {"phone": "%", "timestamp": "%"}',
        phone_masked, NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
```

## Changes Summary

| What | Before | After |
|------|--------|-------|
| `NEW.phone_number` | undefined column (crash) | `NEW.phone_e164` |
| `NEW.verified` (boolean) | undefined column | `NEW.status` (text) checks |
| `NEW.lead_id` reference | kept | kept (column exists) |

## No Edge Function Changes Needed

The `send-otp/index.ts` insert is already correct. All forensic logging stays intact.

## Impact

- Fixes the 500 error on every OTP send attempt
- SMS was already sending successfully via Twilio — now the DB record will persist
- `verify-otp` will find the pending row and verification will complete

