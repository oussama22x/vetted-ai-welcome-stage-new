-- Add INSERT policy for recruiters table to allow signup
CREATE POLICY "Users can create own recruiter profile"
ON public.recruiters FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for projects table
CREATE POLICY "Recruiters can create own projects"
ON public.projects FOR INSERT
WITH CHECK (
  recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
);

-- Add DELETE policies for projects
CREATE POLICY "Recruiters can delete own projects"
ON public.projects FOR DELETE
USING (
  recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete all projects"
ON public.projects FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add INSERT, UPDATE, and DELETE policies for talent_profiles
CREATE POLICY "Recruiters can insert profiles for own projects"
ON public.talent_profiles FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Recruiters can update profiles for own projects"
ON public.talent_profiles FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Recruiters can delete profiles from own projects"
ON public.talent_profiles FOR DELETE
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can delete all talent profiles"
ON public.talent_profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all talent profiles"
ON public.talent_profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));