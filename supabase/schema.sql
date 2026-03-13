-- ============================================================
-- SYNCRO SOLUTIONS DASHBOARD - SUPABASE SCHEMA v2
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Se já rodou a v1, rode apenas a seção "MIGRATIONS v2" no final
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- EMPLOYEES
-- ============================================================
create table if not exists public.employees (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  role            text not null,
  email           text,
  salary          numeric(10, 2) default 0,
  currency        text default 'BRL',
  start_date      date,
  status          text default 'active' check (status in ('active', 'inactive')),
  notes           text,
  -- JSON array: [{"type": "wise", "identifier": "bruno@email.com"}, {"type": "pix", "identifier": "11999999999"}]
  payment_methods jsonb default '[]'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists public.clients (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  company     text,
  email       text,
  country     text,
  platform    text,
  notes       text,
  created_at  timestamptz default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  client_id     uuid references public.clients(id) on delete set null,
  status        text default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  value         numeric(10, 2) default 0,
  currency      text default 'USD',
  start_date    date,
  end_date      date,
  platform      text,
  upwork_url    text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- PROJECT <-> EMPLOYEE (many-to-many) with payment config
-- ============================================================
create table if not exists public.project_employees (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  role_in_project  text,

  -- How this employee is paid on this specific project:
  -- 'fixed'         = fixed monthly amount (you set)
  -- 'hourly'        = hours * hourly_rate (USD)
  -- 'project_split' = X% of total project value (you define %)
  payment_type     text default 'fixed' check (payment_type in ('fixed', 'hourly', 'project_split')),

  hourly_rate      numeric(8, 2),    -- USD/hour (for hourly)
  split_percent    numeric(5, 2),    -- e.g. 40.00 = 40% (for project_split)
  fixed_amount     numeric(10, 2),   -- monthly amount (for fixed)
  fixed_currency   text default 'BRL',

  allocation       integer default 100,
  joined_at        date default current_date,
  unique(project_id, employee_id)
);

-- ============================================================
-- TIME ENTRIES (hours log per employee per project)
-- ============================================================
create table if not exists public.time_entries (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  hours        numeric(6, 2) not null,
  entry_date   date not null default current_date,
  description  text,
  rate_used    numeric(8, 2),   -- snapshot of hourly_rate at time of entry
  total_usd    numeric(10, 2),  -- calculated: hours * rate_used
  created_at   timestamptz default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table if not exists public.payments (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  amount        numeric(10, 2) not null,
  currency      text default 'BRL',
  payment_date  date not null default current_date,
  method        text,
  description   text,
  status        text default 'paid' check (status in ('paid', 'pending', 'cancelled')),
  created_at    timestamptz default now()
);

-- ============================================================
-- PROJECT FILES
-- ============================================================
create table if not exists public.project_files (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  size_bytes    bigint,
  mime_type     text,
  uploaded_by   uuid references auth.users(id),
  created_at    timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.employees         enable row level security;
alter table public.clients           enable row level security;
alter table public.projects          enable row level security;
alter table public.project_employees enable row level security;
alter table public.time_entries      enable row level security;
alter table public.payments          enable row level security;
alter table public.project_files     enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='employees'         and policyname='auth_all') then create policy "auth_all" on public.employees         for all to authenticated using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='clients'           and policyname='auth_all') then create policy "auth_all" on public.clients           for all to authenticated using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='projects'          and policyname='auth_all') then create policy "auth_all" on public.projects          for all to authenticated using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='project_employees' and policyname='auth_all') then create policy "auth_all" on public.project_employees for all to authenticated using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='time_entries'      and policyname='auth_all') then create policy "auth_all" on public.time_entries      for all to authenticated using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='payments'          and policyname='auth_all') then create policy "auth_all" on public.payments          for all to authenticated using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='project_files'     and policyname='auth_all') then create policy "auth_all" on public.project_files     for all to authenticated using (true) with check (true); end if;
end $$;

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('project-files', 'project-files', false)
  on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='auth_storage_all') then
    create policy "auth_storage_all" on storage.objects for all to authenticated using (bucket_id='project-files') with check (bucket_id='project-files');
  end if;
end $$;

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_projects_updated  on public.projects;
drop trigger if exists trg_employees_updated on public.employees;
create trigger trg_projects_updated  before update on public.projects  for each row execute function update_updated_at();
create trigger trg_employees_updated before update on public.employees for each row execute function update_updated_at();

-- ============================================================
-- MIGRATIONS v2 — rode APENAS isso se já tinha a v1 no banco
-- (descomente e execute no SQL Editor)
-- ============================================================
/*
alter table public.employees
  add column if not exists payment_methods jsonb default '[]'::jsonb;

alter table public.project_employees
  add column if not exists payment_type   text default 'fixed',
  add column if not exists hourly_rate    numeric(8,2),
  add column if not exists split_percent  numeric(5,2),
  add column if not exists fixed_amount   numeric(10,2),
  add column if not exists fixed_currency text default 'BRL';

create table if not exists public.time_entries (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  hours        numeric(6, 2) not null,
  entry_date   date not null default current_date,
  description  text,
  rate_used    numeric(8, 2),
  total_usd    numeric(10, 2),
  created_at   timestamptz default now()
);
alter table public.time_entries enable row level security;
create policy "auth_all" on public.time_entries for all to authenticated using (true) with check (true);
*/
