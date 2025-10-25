-- Create RPC to safely check admin whitelist
CREATE OR REPLACE FUNCTION public.is_email_whitelisted(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_whitelist
    WHERE LOWER(email) = LOWER(_email)
  )
$$;

-- Grant execute to all users (needed for signup flow)
GRANT EXECUTE ON FUNCTION public.is_email_whitelisted TO anon, authenticated;

-- Create RPC to handle project creation server-side
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

  -- Insert project
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
    'awaiting',
    'paid',
    NOW() + INTERVAL '48 hours'
  )
  RETURNING id INTO _project_id;

  RETURN _project_id;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.create_project_for_current_user TO authenticated;