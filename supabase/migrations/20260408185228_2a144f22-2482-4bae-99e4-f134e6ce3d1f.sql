
-- Atomic admin credit adjustment with mandatory ledger entry
CREATE OR REPLACE FUNCTION public.admin_adjust_contractor_credits(
  p_contractor_id uuid,
  p_delta integer,
  p_entry_type text,
  p_notes text DEFAULT NULL,
  p_admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
  v_current_balance integer;
  v_new_balance integer;
  v_ledger_id uuid;
BEGIN
  -- Validate delta is non-zero
  IF p_delta = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'zero_delta',
      'message', 'Delta must be non-zero.'
    );
  END IF;

  -- Validate entry_type
  IF p_entry_type NOT IN ('seed', 'admin_adjustment', 'refund', 'correction') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'invalid_entry_type',
      'message', 'entry_type must be one of: seed, admin_adjustment, refund, correction'
    );
  END IF;

  -- Verify contractor exists
  SELECT cp.status INTO v_status
  FROM public.contractor_profiles cp
  WHERE cp.id = p_contractor_id;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'contractor_not_found',
      'message', 'Contractor profile not found.'
    );
  END IF;

  -- Lock credit row
  SELECT balance INTO v_current_balance
  FROM public.contractor_credits
  WHERE contractor_id = p_contractor_id
  FOR UPDATE;

  -- If no credit row exists, create one with balance 0
  IF v_current_balance IS NULL THEN
    INSERT INTO public.contractor_credits (contractor_id, balance)
    VALUES (p_contractor_id, 0);
    v_current_balance := 0;
  END IF;

  v_new_balance := v_current_balance + p_delta;

  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'insufficient_balance',
      'message', 'Adjustment would result in negative balance. Current: ' || v_current_balance || ', delta: ' || p_delta
    );
  END IF;

  -- Update balance
  UPDATE public.contractor_credits
  SET balance = v_new_balance
  WHERE contractor_id = p_contractor_id;

  -- Insert ledger entry
  INSERT INTO public.contractor_credit_ledger (
    contractor_id, delta, balance_after, entry_type,
    reference_type, notes, created_by
  ) VALUES (
    p_contractor_id, p_delta, v_new_balance, p_entry_type,
    'admin_adjustment', p_notes, p_admin_user_id
  )
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'success', true,
    'contractor_id', p_contractor_id,
    'previous_balance', v_current_balance,
    'delta', p_delta,
    'new_balance', v_new_balance,
    'ledger_id', v_ledger_id
  );
END;
$$;
