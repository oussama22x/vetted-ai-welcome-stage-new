-- Align referral_source constraint with front-end options
ALTER TABLE public.recruiters
  DROP CONSTRAINT IF EXISTS recruiters_referral_source_check;

ALTER TABLE public.recruiters
  ADD CONSTRAINT recruiters_referral_source_check
    CHECK (referral_source IS NULL OR referral_source IN (
      'linkedin',
      'instagram',
      'friend_colleague',
      'vfa_newsletter',
      'app_newsletter',
      'antler',
      'google_search',
      'other'
    ));
