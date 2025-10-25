-- Enforce organization-scoped resume storage access
-- Ensure recruiters can only read/write resumes within their organization folder

-- Clean up previous recruiter resume policies
DROP POLICY IF EXISTS "Recruiters upload to own projects only" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters view own project resumes only" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters upload resumes for own organization" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters view resumes for own organization" ON storage.objects;

-- Recruiters may upload resumes only within their organization folder
CREATE POLICY "Recruiters upload resumes for own organization"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  position('/' in name) > 0 AND
  EXISTS (
    SELECT 1
    FROM public.recruiters r
    WHERE r.user_id = auth.uid()
      AND r.organization_id::text = split_part(name, '/', 1)
  )
);

-- Recruiters may download resumes only within their organization folder
CREATE POLICY "Recruiters view resumes for own organization"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  position('/' in name) > 0 AND
  EXISTS (
    SELECT 1
    FROM public.recruiters r
    WHERE r.user_id = auth.uid()
      AND r.organization_id::text = split_part(name, '/', 1)
  )
);
