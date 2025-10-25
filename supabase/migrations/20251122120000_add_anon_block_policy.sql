CREATE POLICY "Block anonymous access to talent profiles"
ON public.talent_profiles
FOR ALL
TO anon
USING (false);
