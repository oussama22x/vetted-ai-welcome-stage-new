-- Migration: Repair project status constraint
-- Normalize any out-of-band status values and ensure constraint is comprehensive

-- 1. Normalize any existing statuses that might be out of range
UPDATE public.projects
SET status = 'pending_activation'
WHERE status NOT IN (
  'draft',
  'pending',
  'pending_activation',
  'activation_in_progress',
  'awaiting_setup_call',
  'awaiting',
  'awaiting_network_match',
  'in_progress',
  'scoring',
  'ready',
  'completed',
  'cancelled'
);

-- 2. Drop old constraint and add comprehensive one
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN (
    'draft',
    'pending',
    'pending_activation',
    'activation_in_progress',
    'awaiting_setup_call',
    'awaiting',
    'awaiting_network_match',
    'in_progress',
    'scoring',
    'ready',
    'completed',
    'cancelled'
  ));

-- 3. Ensure default is set correctly
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'pending_activation';