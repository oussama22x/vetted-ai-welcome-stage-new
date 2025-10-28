-- Drop and recreate get_projects_for_current_user to add company_name
DROP FUNCTION IF EXISTS public.get_projects_for_current_user();

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
    r.company_name
  FROM public.projects p
  JOIN public.recruiters r ON p.recruiter_id = r.id
  WHERE r.user_id = auth.uid()
  ORDER BY p.created_at DESC
$function$;