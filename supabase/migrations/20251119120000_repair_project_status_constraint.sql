-- Ensure project status lifecycle allows activation states
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND constraint_name = 'projects_status_check'
  ) THEN
    ALTER TABLE public.projects
      DROP CONSTRAINT projects_status_check;
  END IF;
END;
$$;

-- Normalise any out-of-band statuses into a supported starting state
UPDATE public.projects
SET status = 'pending_activation'
WHERE status NOT IN (
  'pending_activation',
  'activation_in_progress',
  'pending',
  'awaiting_setup_call',
  'awaiting',
  'scoring',
  'ready',
  'in_progress',
  'completed'
);

-- Allow both legacy and new activation statuses
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

-- Default all new projects into the activation pending state
ALTER TABLE public.projects
  ALTER COLUMN status SET DEFAULT 'pending_activation';
