-- Add new columns to recruiters table for strategic data capture
ALTER TABLE public.recruiters 
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('in_house', 'hiring_manager', 'founder', 'agency', 'other')),
  ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201+')),
  ADD COLUMN IF NOT EXISTS referral_source TEXT CHECK (referral_source IN ('linkedin', 'friend_colleague', 'antler', 'other')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'active'));

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_recruiters_status ON public.recruiters(status);
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON public.recruiters(email);

-- Update existing records to have 'active' status
UPDATE public.recruiters SET status = 'active' WHERE status = 'pending_confirmation';