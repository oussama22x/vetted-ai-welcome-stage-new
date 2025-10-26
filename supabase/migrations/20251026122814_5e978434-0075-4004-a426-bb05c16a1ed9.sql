-- Add 'ops_manager' role to the app_role enum
-- This must run before the v3 tables migration that references this role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ops_manager';