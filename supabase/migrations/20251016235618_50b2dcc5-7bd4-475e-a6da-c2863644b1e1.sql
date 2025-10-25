-- Create function to get admin dashboard metrics
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS TABLE (
  total_signups bigint,
  projects_created bigint,
  calls_booked bigint,
  awaiting_activation bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Total signups (count of recruiters)
    (SELECT COUNT(*) FROM public.recruiters) as total_signups,
    
    -- Projects created (count of all projects)
    (SELECT COUNT(*) FROM public.projects) as projects_created,
    
    -- Calls booked (projects with status 'in_progress' or 'activation_in_progress')
    (SELECT COUNT(*) FROM public.projects 
     WHERE status IN ('in_progress', 'activation_in_progress')) as calls_booked,
    
    -- Awaiting activation (projects with status 'awaiting' or 'pending_activation')
    (SELECT COUNT(*) FROM public.projects 
     WHERE status IN ('awaiting', 'pending_activation')) as awaiting_activation;
$$;