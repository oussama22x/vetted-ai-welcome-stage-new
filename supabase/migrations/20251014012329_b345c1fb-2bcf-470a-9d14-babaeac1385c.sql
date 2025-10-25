-- Drop the old status check constraint
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add new constraint that includes activation statuses
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check CHECK (
    status IN (
      'pending_activation',
      'activation_in_progress',
      'pending',
      'awaiting_setup_call',
      'awaiting',
      'scoring',
      'ready',
      'in_progress',
      'completed'
    )
  );

-- Update all existing projects from 'awaiting' to 'pending_activation'
UPDATE public.projects 
SET status = 'pending_activation' 
WHERE status = 'awaiting';