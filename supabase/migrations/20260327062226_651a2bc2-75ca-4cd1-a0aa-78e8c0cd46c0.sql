ALTER TABLE public.otp_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "otp_failures_select_internal"
  ON public.otp_failures FOR SELECT
  TO authenticated
  USING (public.is_internal_operator());

CREATE POLICY "otp_failures_insert_internal"
  ON public.otp_failures FOR INSERT
  TO authenticated
  WITH CHECK (public.is_internal_operator());

CREATE POLICY "otp_failures_update_internal"
  ON public.otp_failures FOR UPDATE
  TO authenticated
  USING (public.is_internal_operator())
  WITH CHECK (public.is_internal_operator());

CREATE POLICY "otp_failures_delete_internal"
  ON public.otp_failures FOR DELETE
  TO authenticated
  USING (public.is_internal_operator());