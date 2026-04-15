create extension if not exists "pgcrypto";

do $$ begin
  create type contractor_qualification_status as enum (
    'new',
    'qualified',
    'soft_reject',
    'hard_reject'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type contractor_booking_status as enum (
    'not_started',
    'calendly_started',
    'booked',
    'completed',
    'no_show',
    'canceled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type contractor_pipeline_stage as enum (
    'new',
    'booked',
    'showed',
    'qualified_call',
    'proposal_sent',
    'won',
    'lost'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type contractor_activity_type as enum (
    'qualification_completed',
    'calendly_opened',
    'booking_created',
    'booking_completed',
    'no_show',
    'reminder_sent',
    'followup_sent',
    'stage_changed',
    'note_added'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type contractor_followup_type as enum (
    'confirmation_email',
    'reminder_24h',
    'reminder_1h',
    'no_show_followup',
    'post_call_followup'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type contractor_followup_status as enum (
    'pending',
    'sent',
    'failed',
    'canceled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.contractor_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  first_name text,
  last_name text,
  company_name text,
  email text not null,
  phone text,

  service_area text,
  territory_requested text,

  average_job_size_band text,
  monthly_lead_volume_band text,
  close_rate_band text,

  installs_regularly text,
  response_speed text,
  follow_up_consistency text,
  wants_quality_over_volume text,

  qualification_status contractor_qualification_status not null default 'new',
  qualification_score integer not null default 0,

  booking_status contractor_booking_status not null default 'not_started',
  calendly_event_uri text,
  calendly_invitee_uri text,
  calendly_event_start timestamptz,
  calendly_event_end timestamptz,

  pipeline_stage contractor_pipeline_stage not null default 'new',

  source text default 'contractors2_page',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,

  owner_name text,
  notes text,

  constraint contractor_leads_email_check check (char_length(email) > 3)
);

create index if not exists idx_contractor_leads_email
  on public.contractor_leads (email);

create index if not exists idx_contractor_leads_created_at
  on public.contractor_leads (created_at desc);

create index if not exists idx_contractor_leads_qualification_status
  on public.contractor_leads (qualification_status);

create index if not exists idx_contractor_leads_booking_status
  on public.contractor_leads (booking_status);

create index if not exists idx_contractor_leads_pipeline_stage
  on public.contractor_leads (pipeline_stage);

create index if not exists idx_contractor_leads_service_area
  on public.contractor_leads (service_area);

create table if not exists public.contractor_activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contractor_lead_id uuid not null references public.contractor_leads(id) on delete cascade,
  activity_type contractor_activity_type not null,
  activity_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_contractor_activity_log_lead_id
  on public.contractor_activity_log (contractor_lead_id);

create index if not exists idx_contractor_activity_log_type
  on public.contractor_activity_log (activity_type);

create index if not exists idx_contractor_activity_log_created_at
  on public.contractor_activity_log (created_at desc);

create table if not exists public.contractor_followups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contractor_lead_id uuid not null references public.contractor_leads(id) on delete cascade,
  followup_type contractor_followup_type not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status contractor_followup_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_contractor_followups_lead_id
  on public.contractor_followups (contractor_lead_id);

create index if not exists idx_contractor_followups_status
  on public.contractor_followups (status);

create index if not exists idx_contractor_followups_scheduled_for
  on public.contractor_followups (scheduled_for);

create or replace function public.set_contractor_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_contractor_updated_at on public.contractor_leads;

create trigger trg_set_contractor_updated_at
before update on public.contractor_leads
for each row
execute procedure public.set_contractor_updated_at();

create or replace function public.log_contractor_pipeline_change()
returns trigger
language plpgsql
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

drop trigger if exists trg_log_contractor_pipeline_change on public.contractor_leads;

create trigger trg_log_contractor_pipeline_change
after update on public.contractor_leads
for each row
execute procedure public.log_contractor_pipeline_change();

alter table public.contractor_leads enable row level security;
alter table public.contractor_activity_log enable row level security;
alter table public.contractor_followups enable row level security;

drop policy if exists "service_role_full_access_contractor_leads" on public.contractor_leads;
create policy "service_role_full_access_contractor_leads"
on public.contractor_leads
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_access_contractor_activity_log" on public.contractor_activity_log;
create policy "service_role_full_access_contractor_activity_log"
on public.contractor_activity_log
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_access_contractor_followups" on public.contractor_followups;
create policy "service_role_full_access_contractor_followups"
on public.contractor_followups
for all
to service_role
using (true)
with check (true);

comment on table public.contractor_leads is 'Primary contractor CRM records for the contractors2 funnel.';
comment on table public.contractor_activity_log is 'Lifecycle activity log for contractor leads.';
comment on table public.contractor_followups is 'Queued followups and reminders for contractor leads.';