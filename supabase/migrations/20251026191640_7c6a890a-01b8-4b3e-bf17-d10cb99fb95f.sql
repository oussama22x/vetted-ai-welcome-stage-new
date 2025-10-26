-- Migration: Update project booking flow
-- Add new status values to the project status constraint to support the setup call workflow

-- 1. Drop the old constraint and add a comprehensive status constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN (
    'draft',
    'pending',
    'awaiting_setup_call',
    'awaiting',
    'in_progress',
    'scoring',
    'ready',
    'completed',
    'cancelled'
  ));

-- 2. Update the create_project_for_current_user function to set initial status correctly
CREATE OR REPLACE FUNCTION public.create_project_for_current_user(
  p_role_title text,
  p_job_summary text,
  p_candidate_source text,
  p_tier_name text,
  p_tier_id integer,
  p_candidate_count integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id uuid;
  v_project_id uuid;
BEGIN
  SELECT id INTO v_recruiter_id FROM public.recruiters WHERE user_id = auth.uid();
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Recruiter profile not found';
  END IF;
  
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    job_summary,
    candidate_source,
    tier_name,
    tier_id,
    candidate_count,
    status,
    payment_status
  )
  VALUES (
    v_recruiter_id,
    p_role_title,
    p_job_summary,
    p_candidate_source,
    p_tier_name,
    p_tier_id,
    p_candidate_count,
    'pending',
    'pending'
  )
  RETURNING id INTO v_project_id;
  
  RETURN v_project_id;
END;
$$;

-- 3. Add a helper function to mark project as awaiting setup call
CREATE OR REPLACE FUNCTION public.mark_project_awaiting_setup_call(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id uuid;
BEGIN
  -- Verify the project belongs to the current user
  SELECT recruiter_id INTO v_recruiter_id
  FROM public.projects
  WHERE id = p_project_id;
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  IF v_recruiter_id NOT IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update project status
  UPDATE public.projects
  SET status = 'awaiting_setup_call', updated_at = now()
  WHERE id = p_project_id;
END;
$$;