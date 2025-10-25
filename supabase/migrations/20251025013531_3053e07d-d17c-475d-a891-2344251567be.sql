-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter');

-- Create user_roles table (CRITICAL: separate from users for security)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin whitelist table
CREATE TABLE public.admin_whitelist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Recruiters table
CREATE TABLE public.recruiters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    company_name text,
    user_role text,
    company_size text,
    referral_source text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id uuid REFERENCES public.recruiters(id) ON DELETE CASCADE NOT NULL,
    role_title text NOT NULL,
    job_summary text,
    candidate_source text,
    tier_name text,
    tier_id integer,
    candidate_count integer DEFAULT 0,
    status text DEFAULT 'draft',
    payment_status text DEFAULT 'pending',
    sla_deadline timestamptz,
    completed_at timestamptz,
    hours_elapsed numeric,
    candidates_completed integer DEFAULT 0,
    total_candidates integer DEFAULT 0,
    completion_percentage numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Talent profiles table
CREATE TABLE public.talent_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    parsed_name text,
    parsed_email text,
    status text DEFAULT 'pending',
    uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- Evaluations table
CREATE TABLE public.evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    shortlist_file_path text NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Analytics events table
CREATE TABLE public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    stripe_payment_intent_id text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for recruiters
CREATE POLICY "Recruiters can view own profile"
ON public.recruiters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update own profile"
ON public.recruiters FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recruiters"
ON public.recruiters FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all recruiters"
ON public.recruiters FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for projects
CREATE POLICY "Recruiters can view own projects"
ON public.projects FOR SELECT
USING (recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid()));

CREATE POLICY "Recruiters can update own projects"
ON public.projects FOR UPDATE
USING (recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all projects"
ON public.projects FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for talent_profiles
CREATE POLICY "Users can view profiles for their projects"
ON public.talent_profiles FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert profiles"
ON public.talent_profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for evaluations
CREATE POLICY "Users can view evaluations for their projects"
ON public.evaluations FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert evaluations"
ON public.evaluations FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analytics_events
CREATE POLICY "Admins can view all analytics"
ON public.analytics_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert analytics"
ON public.analytics_events FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert analytics for their projects"
ON public.analytics_events FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  )
);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
ON public.payments FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE recruiter_id IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Storage policies for resumes bucket
CREATE POLICY "Admins can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view resumes for their projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.talent_profiles tp
    JOIN public.projects p ON tp.project_id = p.id
    JOIN public.recruiters r ON p.recruiter_id = r.id
    WHERE tp.file_path = name AND r.user_id = auth.uid()
  )
);

-- Functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_email_whitelisted(email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE admin_whitelist.email = is_email_whitelisted.email
  )
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_projects_for_current_user()
RETURNS TABLE (
  id uuid,
  role_title text,
  status text,
  payment_status text,
  candidate_count integer,
  created_at timestamptz,
  tier_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.role_title, p.status, p.payment_status, p.candidate_count, p.created_at, p.tier_name
  FROM public.projects p
  JOIN public.recruiters r ON p.recruiter_id = r.id
  WHERE r.user_id = auth.uid()
  ORDER BY p.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.create_project_for_current_user(
  p_role_title text,
  p_job_summary text,
  p_candidate_source text,
  p_tier_name text,
  p_tier_id integer,
  p_candidate_count integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id uuid;
  v_project_id uuid;
BEGIN
  SELECT id INTO v_recruiter_id FROM public.recruiters WHERE user_id = auth.uid();
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Recruiter profile not found';
  END IF;
  
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    job_summary,
    candidate_source,
    tier_name,
    tier_id,
    candidate_count,
    status,
    payment_status
  )
  VALUES (
    v_recruiter_id,
    p_role_title,
    p_job_summary,
    p_candidate_source,
    p_tier_name,
    p_tier_id,
    p_candidate_count,
    'draft',
    'pending'
  )
  RETURNING id INTO v_project_id;
  
  RETURN v_project_id;
END;
$$;

-- Trigger to auto-grant admin role to whitelisted emails on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_whitelist WHERE email = NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_recruiters_updated_at
BEFORE UPDATE ON public.recruiters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();