-- 1. Create the table for our Stage 1 IP ("The 9 Essentials")
CREATE TABLE public.role_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    definition_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS and add policies for role_definitions
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage their own role_definitions"
ON public.role_definitions
FOR ALL
USING (
    (
        SELECT r.user_id
        FROM public.projects p
        JOIN public.recruiters r ON p.recruiter_id = r.id
        WHERE p.id = project_id
    ) = auth.uid()
)
WITH CHECK (
    (
        SELECT r.user_id
        FROM public.projects p
        JOIN public.recruiters r ON p.recruiter_id = r.id
        WHERE p.id = project_id
    ) = auth.uid()
);

CREATE POLICY "Admins can do anything"
ON public.role_definitions
FOR ALL
USING (
    (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (app_role = 'admin' OR app_role = 'ops_manager')
    ) IS NOT NULL
)
WITH CHECK (
    (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (app_role = 'admin' OR app_role = 'ops_manager')
    ) IS NOT NULL
);

-- 3. Create the table for our Stage 2 IP ("The Proof Scaffold")
CREATE TABLE public.audition_scaffolds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_definition_id UUID UNIQUE NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
    scaffold_data JSONB NOT NULL,
    scaffold_preview_html TEXT,
    -- ✨ NEW: Add versioning columns based on expert review
    version INT NOT NULL DEFAULT 1,
    definition_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS and add policies for audition_scaffolds
ALTER TABLE public.audition_scaffolds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage their own scaffolds"
ON public.audition_scaffolds
FOR ALL
USING (
    (
        SELECT r.user_id
        FROM public.projects p
        JOIN public.role_definitions rd ON p.id = rd.project_id
        JOIN public.recruiters r ON p.recruiter_id = r.id
        WHERE rd.id = role_definition_id
    ) = auth.uid()
)
WITH CHECK (
    (
        SELECT r.user_id
        FROM public.projects p
        JOIN public.role_definitions rd ON p.id = rd.project_id
        JOIN public.recruiters r ON p.recruiter_id = r.id
        WHERE rd.id = role_definition_id
    ) = auth.uid()
);

CREATE POLICY "Admins can do anything"
ON public.audition_scaffolds
FOR ALL
USING (
    (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (app_role = 'admin' OR app_role = 'ops_manager')
    ) IS NOT NULL
)
WITH CHECK (
    (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (app_role = 'admin' OR app_role = 'ops_manager')
    ) IS NOT NULL
);

-- 5. ✅ CORRECTED STATUS UPDATE:
-- The 'project_status' column is TEXT, not an ENUM.
-- We don't need to run any 'ALTER TYPE' command.
-- The value 'awaiting_network_match' will be added as simple TEXT by our app.
-- This migration is now complete.
