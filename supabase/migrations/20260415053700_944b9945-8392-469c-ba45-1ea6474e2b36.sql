create or replace function public.set_contractor_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_contractor_pipeline_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.pipeline_stage is distinct from old.pipeline_stage then
    insert into public.contractor_activity_log (
      contractor_lead_id,
      activity_type,
      activity_data
    )
    values (
      new.id,
      'stage_changed',
      jsonb_build_object(
        'from', old.pipeline_stage,
        'to', new.pipeline_stage
      )
    );
  end if;

  return new;
end;
$$;