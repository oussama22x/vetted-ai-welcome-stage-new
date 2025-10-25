-- Add unique constraint on user_id to enable upsert operations
ALTER TABLE public.recruiters 
ADD CONSTRAINT recruiters_user_id_unique UNIQUE (user_id);