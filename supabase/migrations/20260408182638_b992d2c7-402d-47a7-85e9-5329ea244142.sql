
-- ============================================================
-- unlock_contractor_lead RPC
-- Atomic, race-safe, idempotent credit-backed lead unlock
-- ============================================================

CREATE OR REPLACE FUNCTION public.unlock_contractor_lead(
  p_contractor_id uuid,
  p_lead_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contractor_status text;
  v_current_balance   integer;
  v_existing_unlock   uuid;
  v_new_unlock_id     uuid;
  v_lead_exists       boolean;
BEGIN
  -- 1. Verify contractor profile exists and check status
  SELECT status INTO v_contractor_status
  FROM public.contractor_profiles
  WHERE id = p_contractor_id;

  IF v_contractor_status IS NULL THEN
    RETURN jsonb_build_object(
      'success',          false,
      'already_unlocked', false,
      'remaining_balance', NULL,
      'unlock_id',        NULL,
      'lead_id',          p_lead_id,
      'contractor_id',    p_contractor_id,
      'error_code',       'contractor_not_found',
      'message',          'Contractor profile not found.'
    );
  END IF;

  IF v_contractor_status <> 'active' THEN
    RETURN jsonb_build_object(
      'success',          false,
      'already_unlocked', false,
      'remaining_balance', NULL,
      'unlock_id',        NULL,
      'lead_id',          p_lead_id,
      'contractor_id',    p_contractor_id,
      'error_code',       'contractor_inactive',
      'message',          'Contractor account is ' || v_contractor_status || '.'
    );
  END IF;

  -- 2. Verify the lead actually exists
  SELECT EXISTS(SELECT 1 FROM public.leads WHERE id = p_lead_id)
  INTO v_lead_exists;

  IF NOT v_lead_exists THEN
    RETURN jsonb_build_object(
      'success',          false,
      'already_unlocked', false,
      'remaining_balance', NULL,
      'unlock_id',        NULL,
      'lead_id',          p_lead_id,
      'contractor_id',    p_contractor_id,
      'error_code',       'lead_not_found',
      'message',          'Lead not found.'
    );
  END IF;

  -- 3. Check if already unlocked (idempotent)
  SELECT id INTO v_existing_unlock
  FROM public.contractor_unlocked_leads
  WHERE contractor_id = p_contractor_id
    AND lead_id = p_lead_id;

  IF v_existing_unlock IS NOT NULL THEN
    -- Read current balance for the response
    SELECT balance INTO v_current_balance
    FROM public.contractor_credits
    WHERE contractor_id = p_contractor_id;

    RETURN jsonb_build_object(
      'success',          true,
      'already_unlocked', true,
      'remaining_balance', COALESCE(v_current_balance, 0),
      'unlock_id',        v_existing_unlock,
      'lead_id',          p_lead_id,
      'contractor_id',    p_contractor_id,
      'error_code',       NULL,
      'message',          'Lead was already unlocked.'
    );
  END IF;

  -- 4. Lock credit row and check balance
  SELECT balance INTO v_current_balance
  FROM public.contractor_credits
  WHERE contractor_id = p_contractor_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success',          false,
      'already_unlocked', false,
      'remaining_balance', 0,
      'unlock_id',        NULL,
      'lead_id',          p_lead_id,
      'contractor_id',    p_contractor_id,
      'error_code',       'no_credit_account',
      'message',          'No credit account found for this contractor.'
    );
  END IF;

  IF v_current_balance < 1 THEN
    RETURN jsonb_build_object(
      'success',          false,
      'already_unlocked', false,
      'remaining_balance', v_current_balance,
      'unlock_id',        NULL,
      'lead_id',          p_lead_id,
      'contractor_id',    p_contractor_id,
      'error_code',       'insufficient_credits',
      'message',          'Insufficient credits. Current balance: ' || v_current_balance || '.'
    );
  END IF;

  -- 5. Deduct 1 credit
  UPDATE public.contractor_credits
  SET balance = balance - 1
  WHERE contractor_id = p_contractor_id;

  -- 6. Record the unlock
  INSERT INTO public.contractor_unlocked_leads (contractor_id, lead_id)
  VALUES (p_contractor_id, p_lead_id)
  RETURNING id INTO v_new_unlock_id;

  RETURN jsonb_build_object(
    'success',          true,
    'already_unlocked', false,
    'remaining_balance', v_current_balance - 1,
    'unlock_id',        v_new_unlock_id,
    'lead_id',          p_lead_id,
    'contractor_id',    p_contractor_id,
    'error_code',       NULL,
    'message',          'Lead unlocked successfully.'
  );
END;
$$;
