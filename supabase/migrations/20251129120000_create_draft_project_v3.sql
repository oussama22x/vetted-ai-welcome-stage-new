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
  v_project_code text;
  v_role_definition_id uuid;
BEGIN
  -- Identify the recruiter associated with the authenticated user
  SELECT id
  INTO v_recruiter_id
  FROM public.recruiters
  WHERE user_id = auth.uid();

  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'No recruiter profile found for current user. Please contact support.';
  END IF;

  -- Generate a lightweight project code for internal tracking
  v_project_code := 'DRAFT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

  -- Seed a draft project record with sensible defaults so the wizard can continue
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    job_summary,
    tier_id,
    tier_name,
    anchor_price,
    pilot_price,
    candidate_source,
    candidate_count,
    total_candidates,
    project_code,
    status,
    payment_status
  )
  VALUES (
    v_recruiter_id,
    'Draft Role',
    p_job_description,
    0,
    'Custom Proof',
    0,
    0,
    'network',
    0,
    0,
    v_project_code,
    'pending_activation',
    'pending'
  )
  RETURNING id
  INTO v_project_id;

  -- Create an empty role definition shell that will be populated by the AI pipeline
  INSERT INTO public.role_definitions (
    project_id,
    definition_data
  )
  VALUES (
    v_project_id,
    jsonb_build_object(
      'source', 'create_draft_project_v3',
      'job_description', COALESCE(p_job_description, ''),
      'status', 'pending_generation'
    )
  )
  RETURNING id
  INTO v_role_definition_id;

  -- Prepare an empty audition scaffold record linked to the role definition
  INSERT INTO public.audition_scaffolds (
    role_definition_id,
    scaffold_data,
    scaffold_preview_html,
    definition_snapshot
  )
  VALUES (
    v_role_definition_id,
    '{}'::jsonb,
    NULL,
    '{}'::jsonb
  );

  RETURN v_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_draft_project_v3(TEXT) TO authenticated;
