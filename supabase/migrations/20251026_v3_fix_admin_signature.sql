-- Creates the zero-argument version of is_admin() that our frontend (useAuth) is calling.
-- This function checks if the *currently authenticated user* has an admin or ops role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND (app_role = 'admin' OR app_role = 'ops_manager')
  );
$$;
