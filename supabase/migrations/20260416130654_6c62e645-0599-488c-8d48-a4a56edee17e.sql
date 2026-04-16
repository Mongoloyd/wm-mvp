-- clients: internal operators can INSERT/UPDATE/DELETE
CREATE POLICY "clients_insert_internal" ON public.clients FOR INSERT TO authenticated WITH CHECK (is_internal_operator());
CREATE POLICY "clients_update_internal" ON public.clients FOR UPDATE TO authenticated USING (is_internal_operator()) WITH CHECK (is_internal_operator());
CREATE POLICY "clients_delete_internal" ON public.clients FOR DELETE TO authenticated USING (is_internal_operator());

-- meta_configurations: internal operators can INSERT/UPDATE/DELETE
CREATE POLICY "meta_config_insert_internal" ON public.meta_configurations FOR INSERT TO authenticated WITH CHECK (is_internal_operator());
CREATE POLICY "meta_config_update_internal" ON public.meta_configurations FOR UPDATE TO authenticated USING (is_internal_operator()) WITH CHECK (is_internal_operator());
CREATE POLICY "meta_config_delete_internal" ON public.meta_configurations FOR DELETE TO authenticated USING (is_internal_operator());