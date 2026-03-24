INSERT INTO public.contractors (
  company_name, status, is_vetted, vetted_at,
  service_counties, service_regions, project_types,
  pricing_model, contact_name, accepts_low_grade_leads
) VALUES (
  'Alpha Impact Windows & Doors', 'active', true, now(),
  '{"Palm Beach","Broward","Miami-Dade"}',
  '{"South Florida"}',
  '{"impact_windows","roofing"}',
  'flat_fee', 'Test Operator', true
);