-- =====================================================
-- VETTED AI - COMPLETE DATABASE SCHEMA EXPORT
-- =====================================================
-- Project: vetted-ai-welcome-stage-new-audition-gen
-- Export Date: 2025-11-05
-- Target: Supabase PostgreSQL
-- Purpose: Complete schema for staging/production migration
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================

-- Enable pg_net for HTTP requests from database triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- =====================================================
-- SECTION 2: ENUMS
-- =====================================================

-- Application role enum for user permissions
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'moderator', 
  'user',
  'ops_manager'
);

-- =====================================================
-- SECTION 3: CORE TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: user_roles
-- Purpose: Store user role assignments (separate from auth.users for security)
-- Security: CRITICAL - prevents privilege escalation attacks
-- -----------------------------------------------------
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: admin_whitelist
-- Purpose: Email whitelist for automatic admin role assignment
-- -----------------------------------------------------
CREATE TABLE public.admin_whitelist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: recruiters
-- Purpose: Extended user profiles for recruiters (hiring managers)
-- -----------------------------------------------------
CREATE TABLE public.recruiters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  company_name text,
  company_size text,
  user_role text,
  referral_source text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: projects
-- Purpose: Core project/role records for talent sourcing
-- -----------------------------------------------------
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id uuid NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  role_title text NOT NULL,
  company_name text,
  job_description text,
  job_summary text,
  candidate_source text,
  tier_name text,
  tier_id integer,
  candidate_count integer DEFAULT 0,
  total_candidates integer DEFAULT 0,
  candidates_completed integer DEFAULT 0,
  completion_percentage numeric DEFAULT 0,
  status text DEFAULT 'pending_activation',
  payment_status text DEFAULT 'pending',
  hours_elapsed numeric,
  sla_deadline timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: role_definitions
-- Purpose: AI-generated role definitions (context flags, clarifiers, weights)
-- Storage: JSONB for flexible schema evolution
-- -----------------------------------------------------
CREATE TABLE public.role_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  definition_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: audition_scaffolds
-- Purpose: Generated question scaffolds with preview HTML
-- Versioning: Supports multiple versions per role definition
-- -----------------------------------------------------
CREATE TABLE public.audition_scaffolds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_definition_id uuid NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
  scaffold_data jsonb NOT NULL,
  scaffold_preview_html text,
  definition_snapshot jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audition_scaffolds ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: role_master_banks
-- Purpose: Cached question banks by role family and seniority
-- Status: GENERATING (in progress) | READY (available)
-- -----------------------------------------------------
CREATE TABLE public.role_master_banks (
  bank_id text NOT NULL PRIMARY KEY,
  role_family text NOT NULL,
  seniority_level text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'GENERATING',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_master_banks ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: archetypes
-- Purpose: Performance dimension definitions for question generation
-- Structure: Dimension name, archetype ID, logic prompts, quality eval prompts
-- -----------------------------------------------------
CREATE TABLE public.archetypes (
  dimension text NOT NULL,
  archetype_id text NOT NULL PRIMARY KEY,
  logic_prompt text NOT NULL,
  quality_evals_prompt text NOT NULL,
  parameters_needed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: talent_profiles
-- Purpose: Uploaded candidate resumes and metadata
-- Storage: References files in storage.objects (resumes bucket)
-- -----------------------------------------------------
CREATE TABLE public.talent_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  parsed_name text,
  parsed_email text,
  status text DEFAULT 'pending',
  uploaded_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: evaluations
-- Purpose: Shortlist evaluation records
-- Storage: References shortlist files in storage
-- -----------------------------------------------------
CREATE TABLE public.evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shortlist_file_path text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: payments
-- Purpose: Stripe payment records
-- -----------------------------------------------------
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  stripe_payment_intent_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: analytics_events
-- Purpose: Event tracking for product analytics
-- -----------------------------------------------------
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Table: notification_log
-- Purpose: Track webhook/notification delivery status
-- Integration: pg_net HTTP requests to Slack, etc.
-- -----------------------------------------------------
CREATE TABLE public.notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  request_id bigint,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 4: INDEXES
-- =====================================================

-- Performance indexes on foreign keys
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_recruiters_user_id ON public.recruiters(user_id);
CREATE INDEX idx_projects_recruiter_id ON public.projects(recruiter_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_payment_status ON public.projects(payment_status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_role_definitions_project_id ON public.role_definitions(project_id);
CREATE INDEX idx_audition_scaffolds_role_definition_id ON public.audition_scaffolds(role_definition_id);
CREATE INDEX idx_talent_profiles_project_id ON public.talent_profiles(project_id);
CREATE INDEX idx_evaluations_project_id ON public.evaluations(project_id);
CREATE INDEX idx_payments_project_id ON public.payments(project_id);
CREATE INDEX idx_analytics_events_project_id ON public.analytics_events(project_id);
CREATE INDEX idx_notification_log_project_id ON public.notification_log(project_id);
CREATE INDEX idx_notification_log_status ON public.notification_log(status);

-- =====================================================
-- SECTION 5: SECURITY FUNCTIONS
-- =====================================================
-- CRITICAL: These functions use SECURITY DEFINER to prevent RLS recursion
-- They execute with elevated privileges to safely query protected tables

-- -----------------------------------------------------
-- Function: has_role
-- Purpose: Check if a user has a specific role (prevents RLS recursion)
-- Security: SECURITY DEFINER - executes with owner privileges
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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

-- -----------------------------------------------------
-- Function: is_admin (current user)
-- Purpose: Check if current authenticated user is admin
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- -----------------------------------------------------
-- Function: is_admin (specific user)
-- Purpose: Check if a specific user is admin
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Function: is_email_whitelisted
-- Purpose: Check if email is in admin whitelist
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Function: grant_admin_role
-- Purpose: Assign admin role to user by email
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Trigger function to auto-update updated_at timestamps
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------
-- Function: handle_new_user
-- Purpose: Auto-grant admin role to whitelisted users on signup
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

-- =====================================================
-- SECTION 6: BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Function: create_draft_project_v3
-- Purpose: Create a new draft project for current user
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_draft_project_v3(
  p_job_description text,
  p_role_title text DEFAULT NULL,
  p_company_name text DEFAULT NULL
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
  -- Validate recruiter exists
  SELECT id INTO v_recruiter_id
  FROM public.recruiters
  WHERE user_id = auth.uid();

  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'No recruiter profile found for current user. Please contact support.';
  END IF;

  -- Create project record with company_name
  INSERT INTO public.projects (
    recruiter_id,
    role_title,
    company_name,
    job_description,
    job_summary,
    status,
    payment_status
  )
  VALUES (
    v_recruiter_id,
    COALESCE(p_role_title, 'Draft Role'),
    p_company_name,
    p_job_description,
    NULL,
    'pending_activation',
    'pending'
  )
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;

-- -----------------------------------------------------
-- Function: mark_project_awaiting_setup_call
-- Purpose: Update project status to awaiting_setup_call
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_project_awaiting_setup_call(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id uuid;
BEGIN
  -- Verify the project belongs to the current user
  SELECT recruiter_id INTO v_recruiter_id
  FROM public.projects
  WHERE id = p_project_id;
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  IF v_recruiter_id NOT IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update project status
  UPDATE public.projects
  SET status = 'awaiting_setup_call', updated_at = now()
  WHERE id = p_project_id;
END;
$$;

-- -----------------------------------------------------
-- Function: update_project_status
-- Purpose: Generic project status updater with auth check
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id uuid;
BEGIN
  -- Verify the project belongs to the current user or user is admin
  SELECT recruiter_id INTO v_recruiter_id
  FROM public.projects
  WHERE id = p_project_id;
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  IF v_recruiter_id NOT IN (SELECT id FROM public.recruiters WHERE user_id = auth.uid()) 
     AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update project status
  UPDATE public.projects
  SET status = p_new_status, updated_at = now()
  WHERE id = p_project_id;
END;
$$;

-- -----------------------------------------------------
-- Function: get_projects_for_current_user
-- Purpose: Optimized query to fetch user's projects with metadata
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_projects_for_current_user()
RETURNS TABLE(
  id uuid,
  role_title text,
  status text,
  payment_status text,
  candidate_count integer,
  created_at timestamp with time zone,
  tier_name text,
  company_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, 
    p.role_title, 
    p.status, 
    p.payment_status, 
    p.candidate_count, 
    p.created_at, 
    p.tier_name,
    p.company_name
  FROM public.projects p
  JOIN public.recruiters r ON p.recruiter_id = r.id
  WHERE r.user_id = auth.uid()
  ORDER BY p.created_at DESC
$$;

-- -----------------------------------------------------
-- Function: cleanup_abandoned_drafts
-- Purpose: Remove stale draft projects (maintenance/cron job)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete draft projects older than 7 days with no role_definition
  DELETE FROM public.projects
  WHERE status = 'pending_activation'
    AND role_title = 'Draft Role'
    AND created_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.role_definitions 
      WHERE role_definitions.project_id = projects.id
    );
END;
$$;

-- -----------------------------------------------------
-- Function: notify_sourcing_request_trigger
-- Purpose: Trigger function to send webhook on status change
-- Integration: Uses pg_net to send HTTP POST to Slack webhook
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_sourcing_request_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id bigint;
  log_id uuid;
  function_url text;
BEGIN
  -- Only proceed if status changed to 'awaiting_network_match'
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'awaiting_network_match' THEN
    
    -- Build the function URL (update with your actual project URL)
    function_url := 'https://jnazyoirpxxybqparypd.supabase.co/functions/v1/fn_notify_sourcing_request';
    
    -- Log the notification attempt
    INSERT INTO public.notification_log (
      project_id,
      notification_type,
      status
    )
    VALUES (
      NEW.id,
      'sourcing_request',
      'pending'
    )
    RETURNING id INTO log_id;
    
    -- Make async HTTP request to edge function
    SELECT INTO v_request_id
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'projects',
          'record', row_to_json(NEW)::jsonb,
          'old_record', row_to_json(OLD)::jsonb
        )
      );
    
    -- Update log with request_id
    UPDATE public.notification_log
    SET request_id = v_request_id
    WHERE id = log_id;
    
    RAISE LOG 'Triggered fn_notify_sourcing_request for project %, log_id: %, request_id: %', 
              NEW.id, log_id, v_request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- SECTION 7: TRIGGERS
-- =====================================================

-- Auto-update timestamps on projects table
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update timestamps on recruiters table
CREATE TRIGGER update_recruiters_updated_at
  BEFORE UPDATE ON public.recruiters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update timestamps on notification_log table
CREATE TRIGGER update_notification_log_updated_at
  BEFORE UPDATE ON public.notification_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update timestamps on audition_scaffolds table
CREATE TRIGGER update_audition_scaffolds_updated_at
  BEFORE UPDATE ON public.audition_scaffolds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update timestamps on archetypes table
CREATE TRIGGER update_archetypes_updated_at
  BEFORE UPDATE ON public.archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update timestamps on role_master_banks table
CREATE TRIGGER update_role_master_banks_updated_at
  BEFORE UPDATE ON public.role_master_banks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-grant admin role to whitelisted users on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Send webhook when project status changes to awaiting_network_match
CREATE TRIGGER projects_sourcing_trigger
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_sourcing_request_trigger();

-- =====================================================
-- SECTION 8: ROW-LEVEL SECURITY POLICIES
-- =====================================================

-- -----------------------------------------------------
-- RLS Policies: user_roles
-- -----------------------------------------------------
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: admin_whitelist
-- -----------------------------------------------------
CREATE POLICY "Only admins can view whitelist"
  ON public.admin_whitelist FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert to whitelist"
  ON public.admin_whitelist FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete from whitelist"
  ON public.admin_whitelist FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: recruiters
-- -----------------------------------------------------
CREATE POLICY "Recruiters can view own profile"
  ON public.recruiters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update own profile"
  ON public.recruiters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recruiter profile"
  ON public.recruiters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all recruiters"
  ON public.recruiters FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all recruiters"
  ON public.recruiters FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: projects
-- -----------------------------------------------------
CREATE POLICY "Recruiters can view own projects"
  ON public.projects FOR SELECT
  USING (recruiter_id IN (
    SELECT id FROM recruiters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Recruiters can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (recruiter_id IN (
    SELECT id FROM recruiters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Recruiters can update own projects"
  ON public.projects FOR UPDATE
  USING (recruiter_id IN (
    SELECT id FROM recruiters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Recruiters can delete own projects"
  ON public.projects FOR DELETE
  USING (recruiter_id IN (
    SELECT id FROM recruiters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all projects"
  ON public.projects FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all projects"
  ON public.projects FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: role_definitions
-- -----------------------------------------------------
CREATE POLICY "Recruiters can manage their own role_definitions"
  ON public.role_definitions FOR ALL
  USING ((
    SELECT r.user_id
    FROM projects p
    JOIN recruiters r ON p.recruiter_id = r.id
    WHERE p.id = role_definitions.project_id
  ) = auth.uid());

CREATE POLICY "Admins can do anything"
  ON public.role_definitions FOR ALL
  USING ((
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
      AND (user_roles.role = 'admin' OR user_roles.role = 'ops_manager')
  ) IS NOT NULL);

-- -----------------------------------------------------
-- RLS Policies: audition_scaffolds
-- -----------------------------------------------------
CREATE POLICY "Recruiters can manage their own scaffolds"
  ON public.audition_scaffolds FOR ALL
  USING ((
    SELECT r.user_id
    FROM projects p
    JOIN role_definitions rd ON p.id = rd.project_id
    JOIN recruiters r ON p.recruiter_id = r.id
    WHERE rd.id = audition_scaffolds.role_definition_id
  ) = auth.uid());

CREATE POLICY "Admins can do anything"
  ON public.audition_scaffolds FOR ALL
  USING ((
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'admin' OR user_roles.role = 'ops_manager')
  ) IS NOT NULL);

-- -----------------------------------------------------
-- RLS Policies: role_master_banks
-- -----------------------------------------------------
CREATE POLICY "Authenticated users can view master banks"
  ON public.role_master_banks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage master banks"
  ON public.role_master_banks FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: archetypes
-- -----------------------------------------------------
CREATE POLICY "Authenticated users can view archetypes"
  ON public.archetypes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage archetypes"
  ON public.archetypes FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: talent_profiles
-- -----------------------------------------------------
CREATE POLICY "Users can view profiles for their projects"
  ON public.talent_profiles FOR SELECT
  USING (
    project_id IN (
      SELECT projects.id FROM projects
      WHERE projects.recruiter_id IN (
        SELECT recruiters.id FROM recruiters
        WHERE recruiters.user_id = auth.uid()
      )
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Recruiters can insert profiles for own projects"
  ON public.talent_profiles FOR INSERT
  WITH CHECK (project_id IN (
    SELECT projects.id FROM projects
    WHERE projects.recruiter_id IN (
      SELECT recruiters.id FROM recruiters
      WHERE recruiters.user_id = auth.uid()
    )
  ));

CREATE POLICY "Recruiters can update profiles for own projects"
  ON public.talent_profiles FOR UPDATE
  USING (project_id IN (
    SELECT projects.id FROM projects
    WHERE projects.recruiter_id IN (
      SELECT recruiters.id FROM recruiters
      WHERE recruiters.user_id = auth.uid()
    )
  ));

CREATE POLICY "Recruiters can delete profiles from own projects"
  ON public.talent_profiles FOR DELETE
  USING (project_id IN (
    SELECT projects.id FROM projects
    WHERE projects.recruiter_id IN (
      SELECT recruiters.id FROM recruiters
      WHERE recruiters.user_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can insert profiles"
  ON public.talent_profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all talent profiles"
  ON public.talent_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all talent profiles"
  ON public.talent_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: evaluations
-- -----------------------------------------------------
CREATE POLICY "Users can view evaluations for their projects"
  ON public.evaluations FOR SELECT
  USING (
    project_id IN (
      SELECT projects.id FROM projects
      WHERE projects.recruiter_id IN (
        SELECT recruiters.id FROM recruiters
        WHERE recruiters.user_id = auth.uid()
      )
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can insert evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS Policies: payments
-- -----------------------------------------------------
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    project_id IN (
      SELECT projects.id FROM projects
      WHERE projects.recruiter_id IN (
        SELECT recruiters.id FROM recruiters
        WHERE recruiters.user_id = auth.uid()
      )
    )
    OR has_role(auth.uid(), 'admin')
  );

-- -----------------------------------------------------
-- RLS Policies: analytics_events
-- -----------------------------------------------------
CREATE POLICY "Admins can view all analytics"
  ON public.analytics_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert analytics for their projects"
  ON public.analytics_events FOR INSERT
  WITH CHECK (project_id IN (
    SELECT projects.id FROM projects
    WHERE projects.recruiter_id IN (
      SELECT recruiters.id FROM recruiters
      WHERE recruiters.user_id = auth.uid()
    )
  ));

-- -----------------------------------------------------
-- RLS Policies: notification_log
-- -----------------------------------------------------
CREATE POLICY "Admins can view notification logs"
  ON public.notification_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can view own notification logs"
  ON public.notification_log FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN recruiters r ON p.recruiter_id = r.id
    WHERE r.user_id = auth.uid()
  ));

-- =====================================================
-- SECTION 9: STORAGE BUCKETS & POLICIES
-- =====================================================

-- -----------------------------------------------------
-- Storage Bucket: resumes
-- Purpose: Store uploaded candidate resume files
-- Access: Private (RLS enforced)
-- -----------------------------------------------------

-- Create the resumes bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Allow recruiters to upload resumes for their own projects
CREATE POLICY "Recruiters can upload resumes for own projects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT projects.id FROM projects
      WHERE projects.recruiter_id IN (
        SELECT recruiters.id FROM recruiters
        WHERE recruiters.user_id = auth.uid()
      )
    )
  );

-- Allow recruiters to view resumes for their own projects
CREATE POLICY "Recruiters can view resumes for own projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT projects.id FROM projects
      WHERE projects.recruiter_id IN (
        SELECT recruiters.id FROM recruiters
        WHERE recruiters.user_id = auth.uid()
      )
    )
  );

-- Allow recruiters to delete resumes for their own projects
CREATE POLICY "Recruiters can delete resumes for own projects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT projects.id FROM projects
      WHERE projects.recruiter_id IN (
        SELECT recruiters.id FROM recruiters
        WHERE recruiters.user_id = auth.uid()
      )
    )
  );

-- Allow admins to manage all resumes
CREATE POLICY "Admins can manage all resumes"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'resumes'
    AND has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- SCHEMA EXPORT COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Run this schema.sql in your new Supabase project SQL editor
-- 2. Update the function_url in notify_sourcing_request_trigger() with your project URL
-- 3. Export data using data_export_queries.sql
-- 4. Import data to new project
-- 5. Migrate storage files from old resumes bucket
-- 6. Deploy edge functions to new project
-- 7. Configure secrets (SLACK_SOURCING_WEBHOOK_URL, LOVABLE_API_KEY)
-- 8. Update environment variables in your app
-- =====================================================
