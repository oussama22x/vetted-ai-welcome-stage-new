-- Change the default status for new projects from 'awaiting' to 'pending_activation'
ALTER TABLE public.projects 
  ALTER COLUMN status SET DEFAULT 'pending_activation';

-- Optional: Migrate existing 'awaiting' projects to 'pending_activation'
-- Uncomment the line below if you want to update existing projects
-- UPDATE public.projects SET status = 'pending_activation' WHERE status = 'awaiting';