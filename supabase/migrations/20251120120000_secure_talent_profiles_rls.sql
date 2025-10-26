alter table if exists public.talent_profiles enable row level security;

-- Prevent default access to talent_profiles for any role, including anon
drop policy if exists "Talent profiles default deny" on public.talent_profiles;

create policy "Talent profiles default deny"
  on public.talent_profiles
  for all
  to public
  using (false)
  with check (false);

-- Replace the previous recruiter visibility policy to scope access by organization
drop policy if exists "Recruiters can view own talent profiles" on public.talent_profiles;

create policy "Recruiters can see candidates in their organization"
  on public.talent_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      join public.recruiters r
        on p.recruiter_id = r.id
      where p.id = public.talent_profiles.project_id
        and r.user_id = auth.uid()
    )
  );

create policy "Recruiters can update candidates in their organization"
  on public.talent_profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      join public.recruiters r
        on p.recruiter_id = r.id
      where p.id = public.talent_profiles.project_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      join public.recruiters r
        on p.recruiter_id = r.id
      where p.id = public.talent_profiles.project_id
        and r.user_id = auth.uid()
    )
  );
