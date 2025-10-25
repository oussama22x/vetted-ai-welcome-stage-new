-- Create role enum
create type public.app_role as enum ('admin', 'ops_manager', 'recruiter');

-- Create organizations table
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.organizations enable row level security;

-- Create recruiters table
create table public.recruiters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  organization_id uuid references public.organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.recruiters enable row level security;

-- Create projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique not null,
  recruiter_id uuid references public.recruiters(id) on delete cascade not null,
  organization_id uuid references public.organizations(id),
  
  role_title text not null,
  job_description text,
  job_summary text,
  
  tier_id int not null check (tier_id in (1, 2, 3)),
  tier_name text not null,
  anchor_price decimal(10,2),
  pilot_price decimal(10,2),
  
  candidate_source text not null check (candidate_source in ('own', 'network')),
  candidate_count int default 0,
  
  status text not null default 'awaiting' check (status in ('awaiting', 'scoring', 'ready')),
  payment_status text not null default 'pending' check (payment_status in ('paid', 'pending')),
  
  sla_deadline timestamptz,
  hours_elapsed int default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.projects enable row level security;

create index idx_projects_status on public.projects(status);
create index idx_projects_recruiter on public.projects(recruiter_id);
create index idx_projects_sla on public.projects(sla_deadline) where status != 'ready';

-- Create talent_profiles table
create table public.talent_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  
  file_name text not null,
  file_path text,
  file_size int,
  
  parsed_name text,
  parsed_email text,
  
  status text default 'awaiting' check (status in ('awaiting', 'scoring', 'scored')),
  shortlisted boolean default false,
  score decimal(5,2),
  
  uploaded_at timestamptz default now(),
  evaluated_at timestamptz
);

alter table public.talent_profiles enable row level security;

create index idx_talent_project on public.talent_profiles(project_id);

-- Create payments table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  recruiter_id uuid references public.recruiters(id) not null,
  
  amount decimal(10,2) not null,
  currency text default 'USD',
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  
  payment_provider text,
  provider_reference text,
  
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

-- Create evaluations table
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  talent_profile_id uuid references public.talent_profiles(id),
  
  evaluation_notes text,
  shortlist_file_path text,
  
  evaluated_by uuid references auth.users(id),
  evaluated_at timestamptz default now()
);

alter table public.evaluations enable row level security;

-- Create analytics_events table
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users(id),
  project_id uuid references public.projects(id),
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.analytics_events enable row level security;

create index idx_analytics_type on public.analytics_events(event_type);
create index idx_analytics_project on public.analytics_events(project_id);

-- Create user_roles table for RBAC
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  granted_at timestamptz default now(),
  granted_by uuid references auth.users(id),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create helper function for current user admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::app_role) or public.has_role(auth.uid(), 'ops_manager'::app_role)
$$;

-- RLS Policies for projects
create policy "Admins can view all projects"
on public.projects
for select
to authenticated
using (public.is_admin());

create policy "Admins can update all projects"
on public.projects
for update
to authenticated
using (public.is_admin());

create policy "Admins can insert projects"
on public.projects
for insert
to authenticated
with check (public.is_admin());

create policy "Recruiters can view own projects"
on public.projects
for select
to authenticated
using (
  recruiter_id in (
    select id from public.recruiters where user_id = auth.uid()
  )
);

create policy "Recruiters can insert own projects"
on public.projects
for insert
to authenticated
with check (
  recruiter_id in (
    select id from public.recruiters where user_id = auth.uid()
  )
);

-- RLS Policies for talent_profiles
create policy "Admins can view all talent profiles"
on public.talent_profiles
for select
to authenticated
using (public.is_admin());

create policy "Admins can update talent profiles"
on public.talent_profiles
for update
to authenticated
using (public.is_admin());

create policy "Admins can insert talent profiles"
on public.talent_profiles
for insert
to authenticated
with check (public.is_admin());

create policy "Recruiters can view own talent profiles"
on public.talent_profiles
for select
to authenticated
using (
  project_id in (
    select id from public.projects where recruiter_id in (
      select id from public.recruiters where user_id = auth.uid()
    )
  )
);

create policy "Recruiters can insert own talent profiles"
on public.talent_profiles
for insert
to authenticated
with check (
  project_id in (
    select id from public.projects where recruiter_id in (
      select id from public.recruiters where user_id = auth.uid()
    )
  )
);

-- RLS Policies for recruiters
create policy "Admins can view all recruiters"
on public.recruiters
for select
to authenticated
using (public.is_admin());

create policy "Users can view own recruiter profile"
on public.recruiters
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own recruiter profile"
on public.recruiters
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own recruiter profile"
on public.recruiters
for update
to authenticated
using (user_id = auth.uid());

-- RLS Policies for organizations
create policy "Anyone authenticated can view organizations"
on public.organizations
for select
to authenticated
using (true);

create policy "Admins can insert organizations"
on public.organizations
for insert
to authenticated
with check (public.is_admin());

-- RLS Policies for evaluations (admin only)
create policy "Admins can manage evaluations"
on public.evaluations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS Policies for analytics_events (admin only)
create policy "Admins can view analytics"
on public.analytics_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert analytics"
on public.analytics_events
for insert
to authenticated
with check (public.is_admin());

-- RLS Policies for payments
create policy "Admins can view all payments"
on public.payments
for select
to authenticated
using (public.is_admin());

create policy "Recruiters can view own payments"
on public.payments
for select
to authenticated
using (
  recruiter_id in (
    select id from public.recruiters where user_id = auth.uid()
  )
);

create policy "Recruiters can insert own payments"
on public.payments
for insert
to authenticated
with check (
  recruiter_id in (
    select id from public.recruiters where user_id = auth.uid()
  )
);

-- Create storage bucket for resumes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Storage RLS policies for resumes
create policy "Admins can access all resumes"
on storage.objects
for select
to authenticated
using (bucket_id = 'resumes' and public.is_admin());

create policy "Admins can upload resumes"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'resumes' and public.is_admin());

create policy "Recruiters can upload to own project folders"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes' and
  auth.uid() in (select user_id from public.recruiters)
);

create policy "Recruiters can view own project resumes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes' and
  auth.uid() in (select user_id from public.recruiters)
);

-- Function to grant admin role
create or replace function public.grant_admin_role(_email text)
returns void
language plpgsql
security definer
as $$
declare
  _user_id uuid;
begin
  select id into _user_id from auth.users where email = _email;
  
  if _user_id is null then
    raise exception 'User with email % not found', _email;
  end if;
  
  insert into public.user_roles (user_id, role)
  values (_user_id, 'admin'::app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers for updated_at
create trigger update_organizations_updated_at
before update on public.organizations
for each row execute function public.update_updated_at_column();

create trigger update_recruiters_updated_at
before update on public.recruiters
for each row execute function public.update_updated_at_column();

create trigger update_projects_updated_at
before update on public.projects
for each row execute function public.update_updated_at_column();