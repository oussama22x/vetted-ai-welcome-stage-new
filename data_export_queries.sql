-- =====================================================
-- VETTED AI - DATA EXPORT QUERIES
-- =====================================================
-- Project: vetted-ai-welcome-stage-new-audition-gen
-- Export Date: 2025-11-05
-- Purpose: Export existing data from Lovable Cloud Supabase
-- =====================================================
-- INSTRUCTIONS:
-- 1. Run these queries in your OLD Supabase project SQL Editor
-- 2. Copy the JSON output for each table
-- 3. Use the import queries at the bottom in your NEW project
-- 4. Auth users must be exported separately via Supabase Dashboard
-- =====================================================

-- =====================================================
-- SECTION 1: JSON EXPORT QUERIES (Copy-Paste Friendly)
-- =====================================================
-- These queries return JSON you can copy and use in import queries

-- -----------------------------------------------------
-- Export: admin_whitelist
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS admin_whitelist_data
FROM (
  SELECT id, email, created_at
  FROM public.admin_whitelist
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: recruiters
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS recruiters_data
FROM (
  SELECT 
    id, user_id, full_name, email, company_name, company_size,
    user_role, referral_source, status, created_at, updated_at
  FROM public.recruiters
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: projects
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS projects_data
FROM (
  SELECT 
    id, recruiter_id, role_title, company_name, job_description,
    job_summary, candidate_source, tier_name, tier_id,
    candidate_count, total_candidates, candidates_completed,
    completion_percentage, status, payment_status, hours_elapsed,
    sla_deadline, completed_at, created_at, updated_at
  FROM public.projects
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: role_definitions
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS role_definitions_data
FROM (
  SELECT id, project_id, definition_data, created_at
  FROM public.role_definitions
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: audition_scaffolds
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS audition_scaffolds_data
FROM (
  SELECT 
    id, role_definition_id, scaffold_data, scaffold_preview_html,
    definition_snapshot, version, created_at, updated_at
  FROM public.audition_scaffolds
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: role_master_banks
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS role_master_banks_data
FROM (
  SELECT 
    bank_id, role_family, seniority_level, questions,
    status, created_at, updated_at
  FROM public.role_master_banks
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: archetypes
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS archetypes_data
FROM (
  SELECT 
    dimension, archetype_id, logic_prompt, quality_evals_prompt,
    parameters_needed, created_at, updated_at
  FROM public.archetypes
  ORDER BY dimension, archetype_id
) t;

-- -----------------------------------------------------
-- Export: talent_profiles
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS talent_profiles_data
FROM (
  SELECT 
    id, project_id, file_name, file_path, parsed_name,
    parsed_email, status, uploaded_at
  FROM public.talent_profiles
  ORDER BY uploaded_at
) t;

-- -----------------------------------------------------
-- Export: evaluations
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS evaluations_data
FROM (
  SELECT 
    id, project_id, shortlist_file_path, notes, created_at
  FROM public.evaluations
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: payments
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS payments_data
FROM (
  SELECT 
    id, project_id, amount, status, stripe_payment_intent_id, created_at
  FROM public.payments
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: analytics_events
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS analytics_events_data
FROM (
  SELECT 
    id, project_id, event_type, metadata, created_at
  FROM public.analytics_events
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: notification_log
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS notification_log_data
FROM (
  SELECT 
    id, project_id, notification_type, status, request_id,
    error_message, created_at, updated_at
  FROM public.notification_log
  ORDER BY created_at
) t;

-- -----------------------------------------------------
-- Export: user_roles
-- NOTE: This must be exported AFTER you migrate auth.users
-- The user_id values must match the new auth system
-- -----------------------------------------------------
SELECT jsonb_agg(row_to_json(t)) AS user_roles_data
FROM (
  SELECT 
    id, user_id, role::text as role, created_at
  FROM public.user_roles
  ORDER BY created_at
) t;

-- =====================================================
-- SECTION 2: CSV EXPORT QUERIES (Supabase Dashboard)
-- =====================================================
-- Alternative: Export as CSV files via Supabase Dashboard
-- Go to: Table Editor > Select Table > Export to CSV

-- Or use these COPY commands (requires psql client):

-- COPY public.admin_whitelist TO '/tmp/admin_whitelist.csv' WITH CSV HEADER;
-- COPY public.recruiters TO '/tmp/recruiters.csv' WITH CSV HEADER;
-- COPY public.projects TO '/tmp/projects.csv' WITH CSV HEADER;
-- COPY public.role_definitions TO '/tmp/role_definitions.csv' WITH CSV HEADER;
-- COPY public.audition_scaffolds TO '/tmp/audition_scaffolds.csv' WITH CSV HEADER;
-- COPY public.role_master_banks TO '/tmp/role_master_banks.csv' WITH CSV HEADER;
-- COPY public.archetypes TO '/tmp/archetypes.csv' WITH CSV HEADER;
-- COPY public.talent_profiles TO '/tmp/talent_profiles.csv' WITH CSV HEADER;
-- COPY public.evaluations TO '/tmp/evaluations.csv' WITH CSV HEADER;
-- COPY public.payments TO '/tmp/payments.csv' WITH CSV HEADER;
-- COPY public.analytics_events TO '/tmp/analytics_events.csv' WITH CSV HEADER;
-- COPY public.notification_log TO '/tmp/notification_log.csv' WITH CSV HEADER;
-- COPY public.user_roles TO '/tmp/user_roles.csv' WITH CSV HEADER;

-- =====================================================
-- SECTION 3: DATA IMPORT QUERIES (For New Project)
-- =====================================================
-- Run these in your NEW Supabase project after exporting data
-- Replace <EXPORTED_JSON> with the actual JSON from Section 1

-- -----------------------------------------------------
-- Import: admin_whitelist
-- -----------------------------------------------------
-- INSERT INTO public.admin_whitelist (id, email, created_at)
-- SELECT 
--   (value->>'id')::uuid,
--   value->>'email',
--   (value->>'created_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: recruiters
-- -----------------------------------------------------
-- INSERT INTO public.recruiters (
--   id, user_id, full_name, email, company_name, company_size,
--   user_role, referral_source, status, created_at, updated_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'user_id')::uuid,
--   value->>'full_name',
--   value->>'email',
--   value->>'company_name',
--   value->>'company_size',
--   value->>'user_role',
--   value->>'referral_source',
--   value->>'status',
--   (value->>'created_at')::timestamp with time zone,
--   (value->>'updated_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: projects
-- -----------------------------------------------------
-- INSERT INTO public.projects (
--   id, recruiter_id, role_title, company_name, job_description,
--   job_summary, candidate_source, tier_name, tier_id,
--   candidate_count, total_candidates, candidates_completed,
--   completion_percentage, status, payment_status, hours_elapsed,
--   sla_deadline, completed_at, created_at, updated_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'recruiter_id')::uuid,
--   value->>'role_title',
--   value->>'company_name',
--   value->>'job_description',
--   value->>'job_summary',
--   value->>'candidate_source',
--   value->>'tier_name',
--   (value->>'tier_id')::integer,
--   (value->>'candidate_count')::integer,
--   (value->>'total_candidates')::integer,
--   (value->>'candidates_completed')::integer,
--   (value->>'completion_percentage')::numeric,
--   value->>'status',
--   value->>'payment_status',
--   (value->>'hours_elapsed')::numeric,
--   (value->>'sla_deadline')::timestamp with time zone,
--   (value->>'completed_at')::timestamp with time zone,
--   (value->>'created_at')::timestamp with time zone,
--   (value->>'updated_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: role_definitions
-- -----------------------------------------------------
-- INSERT INTO public.role_definitions (id, project_id, definition_data, created_at)
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'project_id')::uuid,
--   (value->'definition_data')::jsonb,
--   (value->>'created_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: audition_scaffolds
-- -----------------------------------------------------
-- INSERT INTO public.audition_scaffolds (
--   id, role_definition_id, scaffold_data, scaffold_preview_html,
--   definition_snapshot, version, created_at, updated_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'role_definition_id')::uuid,
--   (value->'scaffold_data')::jsonb,
--   value->>'scaffold_preview_html',
--   (value->'definition_snapshot')::jsonb,
--   (value->>'version')::integer,
--   (value->>'created_at')::timestamp with time zone,
--   (value->>'updated_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: role_master_banks
-- -----------------------------------------------------
-- INSERT INTO public.role_master_banks (
--   bank_id, role_family, seniority_level, questions,
--   status, created_at, updated_at
-- )
-- SELECT 
--   value->>'bank_id',
--   value->>'role_family',
--   value->>'seniority_level',
--   (value->'questions')::jsonb,
--   value->>'status',
--   (value->>'created_at')::timestamp with time zone,
--   (value->>'updated_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: archetypes
-- -----------------------------------------------------
-- INSERT INTO public.archetypes (
--   dimension, archetype_id, logic_prompt, quality_evals_prompt,
--   parameters_needed, created_at, updated_at
-- )
-- SELECT 
--   value->>'dimension',
--   value->>'archetype_id',
--   value->>'logic_prompt',
--   value->>'quality_evals_prompt',
--   (value->'parameters_needed')::jsonb,
--   (value->>'created_at')::timestamp with time zone,
--   (value->>'updated_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: talent_profiles
-- -----------------------------------------------------
-- INSERT INTO public.talent_profiles (
--   id, project_id, file_name, file_path, parsed_name,
--   parsed_email, status, uploaded_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'project_id')::uuid,
--   value->>'file_name',
--   value->>'file_path',
--   value->>'parsed_name',
--   value->>'parsed_email',
--   value->>'status',
--   (value->>'uploaded_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: evaluations
-- -----------------------------------------------------
-- INSERT INTO public.evaluations (
--   id, project_id, shortlist_file_path, notes, created_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'project_id')::uuid,
--   value->>'shortlist_file_path',
--   value->>'notes',
--   (value->>'created_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: payments
-- -----------------------------------------------------
-- INSERT INTO public.payments (
--   id, project_id, amount, status, stripe_payment_intent_id, created_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'project_id')::uuid,
--   (value->>'amount')::numeric,
--   value->>'status',
--   value->>'stripe_payment_intent_id',
--   (value->>'created_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: analytics_events
-- -----------------------------------------------------
-- INSERT INTO public.analytics_events (
--   id, project_id, event_type, metadata, created_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'project_id')::uuid,
--   value->>'event_type',
--   (value->'metadata')::jsonb,
--   (value->>'created_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: notification_log
-- -----------------------------------------------------
-- INSERT INTO public.notification_log (
--   id, project_id, notification_type, status, request_id,
--   error_message, created_at, updated_at
-- )
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'project_id')::uuid,
--   value->>'notification_type',
--   value->>'status',
--   (value->>'request_id')::bigint,
--   value->>'error_message',
--   (value->>'created_at')::timestamp with time zone,
--   (value->>'updated_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- -----------------------------------------------------
-- Import: user_roles
-- IMPORTANT: Run this AFTER migrating auth.users
-- -----------------------------------------------------
-- INSERT INTO public.user_roles (id, user_id, role, created_at)
-- SELECT 
--   (value->>'id')::uuid,
--   (value->>'user_id')::uuid,
--   (value->>'role')::app_role,
--   (value->>'created_at')::timestamp with time zone
-- FROM jsonb_array_elements('<EXPORTED_JSON>'::jsonb);

-- =====================================================
-- SECTION 4: VERIFICATION QUERIES
-- =====================================================
-- Run these after import to verify data integrity

-- Count records in each table
SELECT 'admin_whitelist' as table_name, COUNT(*) as record_count FROM public.admin_whitelist
UNION ALL
SELECT 'recruiters', COUNT(*) FROM public.recruiters
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'role_definitions', COUNT(*) FROM public.role_definitions
UNION ALL
SELECT 'audition_scaffolds', COUNT(*) FROM public.audition_scaffolds
UNION ALL
SELECT 'role_master_banks', COUNT(*) FROM public.role_master_banks
UNION ALL
SELECT 'archetypes', COUNT(*) FROM public.archetypes
UNION ALL
SELECT 'talent_profiles', COUNT(*) FROM public.talent_profiles
UNION ALL
SELECT 'evaluations', COUNT(*) FROM public.evaluations
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM public.analytics_events
UNION ALL
SELECT 'notification_log', COUNT(*) FROM public.notification_log
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles;

-- Check foreign key relationships
SELECT 
  'projects without recruiters' as issue,
  COUNT(*) as count
FROM public.projects p
LEFT JOIN public.recruiters r ON p.recruiter_id = r.id
WHERE r.id IS NULL
UNION ALL
SELECT 
  'role_definitions without projects',
  COUNT(*)
FROM public.role_definitions rd
LEFT JOIN public.projects p ON rd.project_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
  'talent_profiles without projects',
  COUNT(*)
FROM public.talent_profiles tp
LEFT JOIN public.projects p ON tp.project_id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- DATA EXPORT COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Run JSON export queries in OLD Supabase project
-- 2. Copy the JSON output for each table
-- 3. Run schema.sql in NEW Supabase project
-- 4. Run import queries in NEW project with exported JSON
-- 5. Run verification queries to check data integrity
-- 6. Export auth.users separately via Supabase Dashboard
-- 7. Migrate storage files from resumes bucket
-- =====================================================
