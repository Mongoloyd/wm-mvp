
-- ═══════════════════════════════════════════════════════════════════
-- 1. contractor_credit_ledger table
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.contractor_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  entry_type text NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ccl_delta_nonzero CHECK (delta <> 0),
  CONSTRAINT ccl_balance_nonneg CHECK (balance_after >= 0),
  CONSTRAINT ccl_entry_type_valid CHECK (entry_type IN ('seed', 'unlock_debit', 'admin_adjustment', 'refund', 'correction'))
);

CREATE INDEX idx_ccl_contractor_created ON public.contractor_credit_ledger (contractor_id, created_at DESC);
CREATE INDEX idx_ccl_entry_type_created ON public.contractor_credit_ledger (entry_type, created_at DESC);

-- RLS
ALTER TABLE public.contractor_credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY ccl_select_own ON public.contractor_credit_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = contractor_id);

-- No direct browser mutations
REVOKE INSERT, UPDATE, DELETE ON public.contractor_credit_ledger FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Identity bridge: contractors.auth_user_id
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

ALTER TABLE public.contractors
  ADD CONSTRAINT contractors_auth_user_id_fkey
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.contractors
  ADD CONSTRAINT contractors_auth_user_id_unique UNIQUE (auth_user_id);

COMMENT ON COLUMN public.contractors.auth_user_id IS
  'Bridge: links this marketplace contractor record to the auth user who owns the contractor_profiles row.';

-- ═══════════════════════════════════════════════════════════════════
-- 3. Upgrade unlock_contractor_lead to insert ledger entries
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.unlock_contractor_lead(p_contractor_id uuid, p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contractor_status text;
  v_current_balance   integer;
  v_existing_unlock   uuid;
  v_new_unlock_id     uuid;
  v_lead_exists       boolean;
  v_new_balance       integer;
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

  -- 3. Check if already unlocked (idempotent — no double ledger)
  SELECT id INTO v_existing_unlock
  FROM public.contractor_unlocked_leads
  WHERE contractor_id = p_contractor_id
    AND lead_id = p_lead_id;

  IF v_existing_unlock IS NOT NULL THEN
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
  v_new_balance := v_current_balance - 1;

  UPDATE public.contractor_credits
  SET balance = v_new_balance
  WHERE contractor_id = p_contractor_id;

  -- 6. Record the unlock
  INSERT INTO public.contractor_unlocked_leads (contractor_id, lead_id)
  VALUES (p_contractor_id, p_lead_id)
  RETURNING id INTO v_new_unlock_id;

  -- 7. Record ledger entry (atomic with the debit)
  INSERT INTO public.contractor_credit_ledger (
    contractor_id, delta, balance_after, entry_type,
    reference_type, reference_id, notes
  ) VALUES (
    p_contractor_id, -1, v_new_balance, 'unlock_debit',
    'lead_unlock', v_new_unlock_id,
    'Lead unlock: ' || p_lead_id::text
  );

  RETURN jsonb_build_object(
    'success',          true,
    'already_unlocked', false,
    'remaining_balance', v_new_balance,
    'unlock_id',        v_new_unlock_id,
    'lead_id',          p_lead_id,
    'contractor_id',    p_contractor_id,
    'error_code',       NULL,
    'message',          'Lead unlocked successfully.'
  );
END;
$function$;
