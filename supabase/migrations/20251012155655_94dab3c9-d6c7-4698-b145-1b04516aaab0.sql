-- Fix warning: Function Search Path Mutable
-- Add search_path to all security-sensitive functions to prevent SQL injection

-- Update has_role function (already has search_path, but ensuring consistency)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Update is_admin function (already has search_path, but ensuring consistency)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select public.has_role(auth.uid(), 'admin'::app_role) or public.has_role(auth.uid(), 'ops_manager'::app_role)
$$;

-- Update grant_admin_role function
CREATE OR REPLACE FUNCTION public.grant_admin_role(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix warning: Resume Storage Access Too Broad
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Recruiters can upload to own project folders" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can view own project resumes" ON storage.objects;

-- Create secure policies that validate project ownership via folder path
CREATE POLICY "Recruiters upload to own projects only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects 
    WHERE recruiter_id IN (
      SELECT id FROM public.recruiters WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Recruiters view own project resumes only"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects 
    WHERE recruiter_id IN (
      SELECT id FROM public.recruiters WHERE user_id = auth.uid()
    )
  )
);

-- Allow admins full access to resumes
CREATE POLICY "Admins can upload any resume"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  public.is_admin()
);

CREATE POLICY "Admins can view any resume"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  public.is_admin()
);

CREATE POLICY "Admins can update any resume"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete any resume"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  public.is_admin()
);

-- Update bucket configuration to add MIME type restrictions
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  file_size_limit = 10485760  -- 10MB limit
WHERE id = 'resumes';