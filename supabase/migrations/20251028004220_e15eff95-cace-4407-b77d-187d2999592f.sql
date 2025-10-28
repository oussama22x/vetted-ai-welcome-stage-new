-- Phase 2: Simplify create_draft_project_v3 to only create project record

CREATE OR REPLACE FUNCTION public.create_draft_project_v3(
  p_job_description TEXT
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
  -- Validate recruiter exists
  SELECT id INTO v_recruiter_id
  FROM public.recruiters
  WHERE user_id = auth.uid();

  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'No recruiter profile found for current user. Please contact support.';
  END IF;

  -- Create ONLY the project record (no placeholders!)
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    job_description,
    job_summary,
    status,
    payment_status
  )
  VALUES (
    v_recruiter_id,
    'Draft Role',
    p_job_description,
    NULL, -- Will be populated by AI
    'pending_activation',
    'pending'
  )
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_draft_project_v3(TEXT) TO authenticated;