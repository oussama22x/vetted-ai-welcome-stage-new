-- Add company_name column to projects table to store the hiring company name from JD
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS company_name text;

COMMENT ON COLUMN public.projects.company_name IS 
  'The hiring company name extracted from the job description (not the recruiter agency name)';

-- Update create_draft_project_v3 to accept company_name parameter
CREATE OR REPLACE FUNCTION public.create_draft_project_v3(
  p_job_description text,
  p_role_title text DEFAULT NULL,
  p_company_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recruiter_id uuid;
  v_project_id uuid;
BEGIN
  -- Validate recruiter exists
  SELECT id INTO v_recruiter_id
  FROM public.recruiters
  WHERE user_id = auth.uid();

  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'No recruiter profile found for current user. Please contact support.';
  END IF;

  -- Create project record with company_name
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    company_name,
    job_description,
    job_summary,
    status,
    payment_status
  )
  VALUES (
    v_recruiter_id,
    COALESCE(p_role_title, 'Draft Role'),
    p_company_name,
    p_job_description,
    NULL,
    'pending_activation',
    'pending'
  )
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$function$;

-- Fix get_projects_for_current_user to return project's company_name (not recruiter's)
CREATE OR REPLACE FUNCTION public.get_projects_for_current_user()
RETURNS TABLE (
  id uuid,
  role_title text,
  status text,
  payment_status text,
  candidate_count integer,
  created_at timestamp with time zone,
  tier_name text,
  company_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, 
    p.role_title, 
    p.status, 
    p.payment_status, 
    p.candidate_count, 
    p.created_at, 
    p.tier_name,
    p.company_name
  FROM public.projects p
  JOIN public.recruiters r ON p.recruiter_id = r.id
  WHERE r.user_id = auth.uid()
  ORDER BY p.created_at DESC
$function$;