-- 1. Create the table for our Stage 1 IP ("The 9 Essentials")
CREATE TABLE public.role_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    definition_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
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
);

CREATE POLICY "Admins can do anything"
ON public.role_definitions
FOR ALL
USING (
    (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (role = 'admin' OR role = 'ops_manager')
    ) IS NOT NULL
);

-- 3. Create the table for our Stage 2 IP ("The Proof Scaffold")
CREATE TABLE public.audition_scaffolds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_definition_id UUID UNIQUE NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
    scaffold_data JSONB NOT NULL,
    scaffold_preview_html TEXT,
    version INT DEFAULT 1 NOT NULL,
    definition_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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
);

CREATE POLICY "Admins can do anything"
ON public.audition_scaffolds
FOR ALL
USING (
    (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (role = 'admin' OR role = 'ops_manager')
    ) IS NOT NULL
);