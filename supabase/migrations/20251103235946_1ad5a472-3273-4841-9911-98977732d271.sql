-- ============================================================================
-- Migration: Create Archetypes and Role_Master_Banks Tables
-- Purpose: Support On-Demand Caching system for AI-generated audition questions
-- Author: VettedAI System
-- ============================================================================

-- ============================================================================
-- TABLE 1: Archetypes (Question Generation Templates - Core IP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.archetypes (
  archetype_id TEXT PRIMARY KEY,
  dimension TEXT NOT NULL,
  logic_prompt TEXT NOT NULL,
  parameters_needed JSONB NOT NULL DEFAULT '[]'::jsonb,
  quality_evals_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure dimension is one of the 6 valid VettedAI dimensions
  CONSTRAINT valid_dimension CHECK (dimension IN (
    'Cognitive', 'Execution', 'Communication', 
    'Emotional Intelligence', 'Adaptability', 'Judgment'
  ))
);

-- Add table comment
COMMENT ON TABLE public.archetypes IS 
  'Core IP: Question generation templates for VettedAI Dimension → Question Archetype Framework';
COMMENT ON COLUMN public.archetypes.archetype_id IS 
  'Unique template identifier (e.g., "cognitive_analytical_ops_v1")';
COMMENT ON COLUMN public.archetypes.logic_prompt IS 
  'AI instruction template for generating questions with placeholder parameters';
COMMENT ON COLUMN public.archetypes.parameters_needed IS 
  'Array of required role definition parameters (e.g., ["Primary Goal", "Context/Scenario"])';
COMMENT ON COLUMN public.archetypes.quality_evals_prompt IS 
  'Validation criteria to ensure generated questions meet quality standards';

-- Enable RLS
ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Archetypes
CREATE POLICY "Admins can manage archetypes"
  ON public.archetypes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view archetypes"
  ON public.archetypes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_archetypes_dimension ON public.archetypes(dimension);

-- ============================================================================
-- TABLE 2: Role_Master_Banks (40-Question Cache Vault)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_master_banks (
  bank_id TEXT PRIMARY KEY,
  role_family TEXT NOT NULL,
  seniority_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'GENERATING',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure status is one of the 3 valid states
  CONSTRAINT valid_status CHECK (status IN ('GENERATING', 'READY', 'FAILED')),
  
  -- Ensure role_family matches fn_generate_role_definition options
  CONSTRAINT valid_role_family CHECK (role_family IN (
    'Product Mgmt', 'Engineering', 'Sales', 'Operations', 'Design / UX',
    'Compliance / Risk', 'Finance', 'Marketing', 'Human Resources',
    'Customer Support', 'Leadership / Strat', 'Growth PM', 'RevOps',
    'UX Research', 'Other'
  )),
  
  -- Ensure seniority_level matches fn_generate_role_definition options
  CONSTRAINT valid_seniority CHECK (seniority_level IN (
    'Junior', 'Senior', 'Manager', 'Not specified'
  ))
);

-- Add table comments
COMMENT ON TABLE public.role_master_banks IS 
  'Cache vault for 40-question banks keyed by unique role fingerprint (e.g., "Operations-Senior-TimeSensitive")';
COMMENT ON COLUMN public.role_master_banks.bank_id IS 
  'Unique fingerprint: {role_family}-{seniority_level}[-Startup][-Leadership]';
COMMENT ON COLUMN public.role_master_banks.status IS 
  'GENERATING (in progress), READY (cached), or FAILED (needs retry)';
COMMENT ON COLUMN public.role_master_banks.questions IS 
  'Array of 40 question objects with structure: [{question_id, dimension, archetype_id, question_text, evaluation_rubric, difficulty}]';

-- Enable RLS
ALTER TABLE public.role_master_banks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Role_Master_Banks
CREATE POLICY "Authenticated users can view master banks"
  ON public.role_master_banks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage master banks"
  ON public.role_master_banks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_role_master_banks_lookup 
  ON public.role_master_banks(role_family, seniority_level);
CREATE INDEX idx_role_master_banks_status 
  ON public.role_master_banks(status);

-- ============================================================================
-- Triggers: Auto-update updated_at timestamps
-- ============================================================================

-- Trigger for Archetypes
CREATE TRIGGER set_archetypes_updated_at
  BEFORE UPDATE ON public.archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for Role_Master_Banks
CREATE TRIGGER set_role_master_banks_updated_at
  BEFORE UPDATE ON public.role_master_banks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'archetypes') THEN
    RAISE NOTICE '✅ Table "archetypes" created successfully';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_master_banks') THEN
    RAISE NOTICE '✅ Table "role_master_banks" created successfully';
  END IF;
END $$;