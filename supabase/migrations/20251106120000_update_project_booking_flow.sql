-- Adjust project status lifecycle for setup call workflow
ALTER TABLE public.projects
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check CHECK (
    status IN ('pending', 'awaiting_setup_call', 'awaiting', 'scoring', 'ready')
  );

-- Update any legacy rows using deprecated statuses
UPDATE public.projects
SET status = 'awaiting'
WHERE status NOT IN ('pending', 'awaiting_setup_call', 'awaiting', 'scoring', 'ready');

-- Ensure new projects start in a pending state without payment
CREATE OR REPLACE FUNCTION public.create_project_for_current_user(
  _role_title text,
  _job_description text,
  _job_summary text,
  _tier_id integer,
  _tier_name text,
  _anchor_price numeric,
  _pilot_price numeric,
  _candidate_source text,
  _candidate_count integer,
  _user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recruiter_id uuid;
  _project_id uuid;
  _project_code text;
BEGIN
  -- Get recruiter_id for current user
  SELECT id INTO _recruiter_id
  FROM public.recruiters
  WHERE user_id = COALESCE(_user_id, auth.uid());

  -- Validate recruiter exists
  IF _recruiter_id IS NULL THEN
    RAISE EXCEPTION 'No recruiter profile found for current user. Please contact support.';
  END IF;

  -- Generate unique project code
  _project_code := 'PROJ-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

  -- Insert project in pending state
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    job_description,
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
    payment_status,
    sla_deadline
  ) VALUES (
    _recruiter_id,
    _role_title,
    _job_description,
    _job_summary,
    _tier_id,
    _tier_name,
    _anchor_price,
    _pilot_price,
    _candidate_source,
    _candidate_count,
    _candidate_count,
    _project_code,
    'pending',
    'pending',
    NULL
  )
  RETURNING id INTO _project_id;

  RETURN _project_id;
END;
$$;

-- Preserve execute permissions
GRANT EXECUTE ON FUNCTION public.create_project_for_current_user TO authenticated;

-- Allow recruiters to mark a project as awaiting a setup call with explicit user ownership checks
CREATE OR REPLACE FUNCTION public.mark_project_awaiting_setup_call(
  _project_id uuid,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recruiter_id uuid;
BEGIN
  SELECT id INTO _recruiter_id
  FROM public.recruiters
  WHERE user_id = _user_id;

  IF _recruiter_id IS NULL THEN
    RAISE EXCEPTION 'No recruiter profile found for current user. Please contact support.';
  END IF;

  UPDATE public.projects
  SET status = 'awaiting_setup_call'
  WHERE id = _project_id AND recruiter_id = _recruiter_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or you do not have permission to update it.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_project_awaiting_setup_call TO authenticated;
