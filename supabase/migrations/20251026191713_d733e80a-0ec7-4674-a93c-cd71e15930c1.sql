-- Migration: Add project activation status
-- This migration adds a status column to track project activation states

-- 1. Add status column if it doesn't exist (it might already exist from earlier migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN status text DEFAULT 'pending_activation';
  END IF;
END $$;

-- 2. Update the status constraint to include activation states
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN (
    'draft',
    'pending',
    'pending_activation',
    'activation_in_progress',
    'awaiting_setup_call',
    'awaiting',
    'awaiting_network_match',
    'in_progress',
    'scoring',
    'ready',
    'completed',
    'cancelled'
  ));

-- 3. Set default value for status column
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'pending_activation';

-- 4. Update create_project_for_current_user to use pending_activation
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
    'pending_activation',
    'pending'
  )
  RETURNING id INTO v_project_id;
  
  RETURN v_project_id;
END;
$$;

-- 5. Add function to update project status with validation
CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id uuid;
BEGIN
  -- Verify the project belongs to the current user or user is admin
  SELECT recruiter_id INTO v_recruiter_id
  FROM public.projects
  WHERE id = p_project_id;
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  IF v_recruiter_id NOT IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid()) 
     AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update project status
  UPDATE public.projects
  SET status = p_new_status, updated_at = now()
  WHERE id = p_project_id;
END;
$$;