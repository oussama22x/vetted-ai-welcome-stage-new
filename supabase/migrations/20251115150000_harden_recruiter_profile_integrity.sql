-- Ensure recruiter profiles remain unique per auth user and align enum constraints
BEGIN;

WITH ranked_recruiters AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS row_number
  FROM public.recruiters
)
DELETE FROM public.recruiters r
USING ranked_recruiters rr
WHERE r.id = rr.id
  AND rr.row_number > 1;

-- Rebuild referral source constraint to match application options
ALTER TABLE public.recruiters
  DROP CONSTRAINT IF EXISTS recruiters_referral_source_check;

ALTER TABLE public.recruiters
  ADD CONSTRAINT recruiters_referral_source_check
    CHECK (
      referral_source IS NULL OR referral_source IN (
        'linkedin',
        'instagram',
        'friend_colleague',
        'vfa_newsletter',
        'app_newsletter',
        'antler',
        'google_search',
        'other'
      )
    );

-- Guarantee one recruiter profile per auth user
ALTER TABLE public.recruiters
  ADD CONSTRAINT IF NOT EXISTS recruiters_user_id_key UNIQUE (user_id);

COMMIT;
