-- Update create_draft_project_v3 to accept and use role_title parameter
-- Note: Required parameters must come before optional ones
CREATE OR REPLACE FUNCTION public.create_draft_project_v3(
  p_job_description text,
  p_role_title text DEFAULT NULL
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

  -- Create project record with role title
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
    COALESCE(p_role_title, 'Draft Role'),
    p_job_description,
    NULL,
    'pending_activation',
    'pending'
  )
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$function$;