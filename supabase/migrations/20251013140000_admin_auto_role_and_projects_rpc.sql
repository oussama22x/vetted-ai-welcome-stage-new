-- Automatically assign admin role to whitelisted users on signup
CREATE OR REPLACE FUNCTION public.apply_admin_whitelist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'admin'::public.app_role, NEW.id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_admin_whitelist_after_signup ON auth.users;

CREATE TRIGGER apply_admin_whitelist_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.apply_admin_whitelist();

-- Provide a reliable way for recruiters to fetch their projects
CREATE OR REPLACE FUNCTION public.get_projects_for_current_user()
RETURNS TABLE (
  id uuid,
  role_title text,
  status text,
  payment_status text,
  candidate_count integer,
  created_at timestamptz,
  tier_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.role_title,
    p.status,
    p.payment_status,
    COALESCE(p.candidate_count, 0) AS candidate_count,
    p.created_at,
    p.tier_name
  FROM public.projects p
  INNER JOIN public.recruiters r ON r.id = p.recruiter_id
  WHERE r.user_id = auth.uid()
  ORDER BY p.created_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_projects_for_current_user TO authenticated;
