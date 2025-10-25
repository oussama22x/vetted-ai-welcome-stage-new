-- Create RPC to return aggregate metrics for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _metrics jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_signups', COALESCE((SELECT COUNT(*) FROM auth.users), 0),
    'projects_created', COALESCE((SELECT COUNT(*) FROM public.projects), 0),
    'calls_booked',
      COALESCE(
        (SELECT COUNT(*) FROM public.projects WHERE status = 'activation_in_progress'),
        0
      ),
    'awaiting_activation',
      COALESCE(
        (SELECT COUNT(*) FROM public.projects WHERE status = 'pending_activation'),
        0
      )
  )
  INTO _metrics;

  RETURN _metrics;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics TO authenticated;
