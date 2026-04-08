
-- ============================================================
-- Stripe Credit Checkout — purchase table + fulfillment RPC
-- ============================================================

-- 1. Purchase audit table
CREATE TABLE public.contractor_credit_purchases (
  id                          uuid        NOT NULL DEFAULT gen_random_uuid(),
  contractor_id               uuid        NOT NULL,
  stripe_checkout_session_id  text        NOT NULL,
  stripe_payment_intent_id    text            NULL,
  stripe_customer_id          text            NULL,
  credit_pack_code            text        NOT NULL,
  credits_purchased           integer     NOT NULL,
  amount_total_cents          integer     NOT NULL,
  currency                    text        NOT NULL DEFAULT 'usd',
  status                      text        NOT NULL DEFAULT 'pending',
  fulfilled_at                timestamptz     NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contractor_credit_purchases_pkey
    PRIMARY KEY (id),

  CONSTRAINT contractor_credit_purchases_contractor_id_fkey
    FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,

  CONSTRAINT contractor_credit_purchases_session_id_uq
    UNIQUE (stripe_checkout_session_id),

  CONSTRAINT contractor_credit_purchases_status_check
    CHECK (status IN ('pending', 'paid', 'fulfilled', 'failed', 'expired')),

  CONSTRAINT contractor_credit_purchases_credits_positive
    CHECK (credits_purchased > 0),

  CONSTRAINT contractor_credit_purchases_amount_positive
    CHECK (amount_total_cents > 0)
);

-- Indexes
CREATE INDEX idx_ccp_contractor_created
  ON public.contractor_credit_purchases (contractor_id, created_at DESC);

CREATE INDEX idx_ccp_status
  ON public.contractor_credit_purchases (status);

-- RLS
ALTER TABLE public.contractor_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own purchases
CREATE POLICY ccp_select_own
  ON public.contractor_credit_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = contractor_id);

-- Internal operators can read all
CREATE POLICY ccp_select_internal
  ON public.contractor_credit_purchases
  FOR SELECT
  TO authenticated
  USING (public.is_internal_operator());

-- No direct browser inserts/updates/deletes — service-role only
CREATE POLICY ccp_service_role_all
  ON public.contractor_credit_purchases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 2. Atomic idempotent fulfillment function
CREATE OR REPLACE FUNCTION public.fulfill_contractor_credit_purchase(
  p_session_id        text,
  p_payment_intent_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_purchase           record;
  v_current_balance    integer;
  v_new_balance        integer;
  v_ledger_id          uuid;
BEGIN
  -- Lock the purchase row for this session
  SELECT *
    INTO v_purchase
    FROM public.contractor_credit_purchases
   WHERE stripe_checkout_session_id = p_session_id
     FOR UPDATE;

  -- Purchase not found
  IF v_purchase IS NULL THEN
    RETURN jsonb_build_object(
      'success',    false,
      'error_code', 'purchase_not_found',
      'message',    'No purchase record for session: ' || p_session_id
    );
  END IF;

  -- Already fulfilled — idempotent return
  IF v_purchase.status = 'fulfilled' THEN
    RETURN jsonb_build_object(
      'success',        true,
      'already_fulfilled', true,
      'purchase_id',    v_purchase.id,
      'contractor_id',  v_purchase.contractor_id,
      'credits',        v_purchase.credits_purchased,
      'fulfilled_at',   v_purchase.fulfilled_at
    );
  END IF;

  -- Only fulfill from 'paid' status
  IF v_purchase.status <> 'paid' THEN
    RETURN jsonb_build_object(
      'success',    false,
      'error_code', 'invalid_status',
      'message',    'Purchase status is ' || v_purchase.status || ', expected paid.'
    );
  END IF;

  -- Lock credit row and get current balance
  SELECT balance INTO v_current_balance
    FROM public.contractor_credits
   WHERE contractor_id = v_purchase.contractor_id
     FOR UPDATE;

  -- If no credit row exists, create one
  IF v_current_balance IS NULL THEN
    INSERT INTO public.contractor_credits (contractor_id, balance)
    VALUES (v_purchase.contractor_id, 0);
    v_current_balance := 0;
  END IF;

  v_new_balance := v_current_balance + v_purchase.credits_purchased;

  -- Update balance
  UPDATE public.contractor_credits
     SET balance = v_new_balance
   WHERE contractor_id = v_purchase.contractor_id;

  -- Insert ledger entry
  INSERT INTO public.contractor_credit_ledger (
    contractor_id, delta, balance_after, entry_type,
    reference_type, reference_id, notes
  ) VALUES (
    v_purchase.contractor_id,
    v_purchase.credits_purchased,
    v_new_balance,
    'stripe_purchase',
    'credit_purchase',
    v_purchase.id,
    'Stripe purchase: ' || v_purchase.credit_pack_code || ' (' || v_purchase.credits_purchased || ' credits)'
  )
  RETURNING id INTO v_ledger_id;

  -- Mark purchase fulfilled
  UPDATE public.contractor_credit_purchases
     SET status                    = 'fulfilled',
         fulfilled_at              = now(),
         stripe_payment_intent_id  = COALESCE(p_payment_intent_id, v_purchase.stripe_payment_intent_id)
   WHERE id = v_purchase.id;

  RETURN jsonb_build_object(
    'success',            true,
    'already_fulfilled',  false,
    'purchase_id',        v_purchase.id,
    'contractor_id',      v_purchase.contractor_id,
    'credits',            v_purchase.credits_purchased,
    'previous_balance',   v_current_balance,
    'new_balance',        v_new_balance,
    'ledger_id',          v_ledger_id,
    'fulfilled_at',       now()
  );
END;
$$;
