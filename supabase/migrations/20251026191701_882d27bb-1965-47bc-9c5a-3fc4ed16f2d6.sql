-- Migration: Harden recruiter profile integrity
-- Ensure one recruiter profile per user account

-- 1. Remove duplicate recruiter profiles (keep the most recent one per user_id)
DELETE FROM public.recruiters
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.recruiters
  ORDER BY user_id, created_at DESC
);

-- 2. Add unique constraint to prevent future duplicates
ALTER TABLE public.recruiters ADD CONSTRAINT recruiters_user_id_unique UNIQUE (user_id);