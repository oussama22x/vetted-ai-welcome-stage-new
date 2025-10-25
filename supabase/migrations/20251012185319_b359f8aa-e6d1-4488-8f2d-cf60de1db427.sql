-- Part 1.2: Grant admin roles to whitelisted users who don't have them yet
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  au.id,
  'admin'::app_role,
  NULL
FROM auth.users au
INNER JOIN public.admin_whitelist aw ON au.email = aw.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = au.id AND ur.role = 'admin'::app_role
);

-- Part 2.1: Create recruiter profiles for users who don't have them
INSERT INTO public.recruiters (user_id, email, full_name, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'active'::text
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.recruiters r WHERE r.user_id = au.id
)
ON CONFLICT (email) DO NOTHING;