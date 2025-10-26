-- 1. Create the table for our Stage 1 IP ("The 9 Essentials")
CREATE TABLE public.role_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- This links our definition to the project created in the wizard
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    -- This stores the "9 Essentials" (Goals, Stakeholders, Tools, etc.)
    definition_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Enable RLS (Row Level Security) for the new table ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policy: Recruiters can only manage definitions linked to their own projects CREATE POLICY "Recruiters can manage their own role_definitions" ON public.role_definitions FOR ALL USING ( -- This checks if the 'recruiter_id' on the associated 'project' matches the logged-in user (SELECT recruiter_id FROM public.projects WHERE id = project_id) = auth.uid() );

-- 4. Add RLS Policy: Admins can do anything CREATE POLICY "Admins can do anything" ON public.role_definitions FOR ALL -- This checks the 'user_roles' table for an admin role USING ( (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (app_role = 'admin' OR app_role = 'ops_manager')) IS NOT NULL );

-- 5. Create the table for our Stage 2 IP ("The Proof Scaffold") CREATE TABLE public.audition_scaffolds ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- This links our scaffold to its parent definition role_definition_id UUID UNIQUE NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE, -- This stores the "Proof Scaffold" IP (Objective, Dials, Mechanics, etc.) scaffold_data JSONB NOT NULL, -- This stores the generated "Candidate Preview" text/html for the UI scaffold_preview_html TEXT, created_at TIMESTAMPTZ DEFAULT now() );

-- 6. Enable RLS for the scaffolds table ALTER TABLE public.audition_scaffolds ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS Policy: Recruiters can only manage scaffolds linked to their definitions CREATE POLICY "Recruiters can manage their own scaffolds" ON public.audition_scaffolds FOR ALL USING ( ( -- This is a nested check: Scaffold -> Definition -> Project -> Recruiter ID SELECT p.recruiter_id FROM public.projects p JOIN public.role_definitions rd ON p.id = rd.project_id WHERE rd.id = role_definition_id ) = auth.uid() );

-- 8. Add RLS Policy: Admins can do anything CREATE POLICY "Admins can do anything" ON public.audition_scaffolds FOR ALL USING ( (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (app_role = 'admin' OR app_role = 'ops_manager')) IS NOT NULL );

-- 9. Add our new status for the "Service Wedge" path to the existing project_status type ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'awaiting_network_match';
