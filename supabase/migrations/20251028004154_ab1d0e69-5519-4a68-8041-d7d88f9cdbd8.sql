-- Phase 1: Add job_description column and cleanup function

-- Add job_description column to store the raw JD text
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS job_description TEXT;

COMMENT ON COLUMN public.projects.job_description IS 
  'Raw job description text uploaded by recruiter. Distinct from job_summary which is AI-generated.';

-- Create cleanup function for abandoned draft projects
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete draft projects older than 7 days with no role_definition
  DELETE FROM public.projects
  WHERE status = 'pending_activation'
    AND role_title = 'Draft Role'
    AND created_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.role_definitions 
      WHERE role_definitions.project_id = projects.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_abandoned_drafts() TO authenticated;