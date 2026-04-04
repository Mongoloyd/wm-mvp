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