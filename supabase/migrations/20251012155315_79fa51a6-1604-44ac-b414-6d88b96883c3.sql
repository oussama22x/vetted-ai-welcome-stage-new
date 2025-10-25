-- Fix critical security issue: Add RLS policies to user_roles table
-- This prevents privilege escalation attacks where users could grant themselves admin roles

-- Policy 1: Users can view their own roles OR admins can view all roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Policy 2: Only admins can insert new role assignments
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policy 3: Only admins can update role assignments
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 4: Only admins can delete role assignments
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Fix critical security issue: Block anonymous access to recruiters table
-- This prevents competitors from scraping recruiter contact information

CREATE POLICY "Block anonymous access to recruiters"
ON public.recruiters
FOR SELECT
TO anon
USING (false);