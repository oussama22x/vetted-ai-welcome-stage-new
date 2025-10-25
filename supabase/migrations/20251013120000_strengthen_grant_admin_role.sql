-- Ensure admin role grants are restricted to whitelisted users
-- and callable from the client applications.
CREATE OR REPLACE FUNCTION public.grant_admin_role(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _normalized_email text := lower(_email);
BEGIN
  -- Look up the auth user for the provided email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE lower(email) = _normalized_email;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _email;
  END IF;

  -- Ensure the email exists in the whitelist table
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_whitelist
    WHERE lower(email) = _normalized_email
  ) THEN
    RAISE EXCEPTION 'Email % is not authorized for admin access', _email;
  END IF;

  -- Only allow the matching user or an existing admin to perform the grant
  IF auth.uid() IS DISTINCT FROM _user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to grant admin role for this email';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Allow authenticated users (with a valid session) to call the function
GRANT EXECUTE ON FUNCTION public.grant_admin_role(text) TO authenticated;
