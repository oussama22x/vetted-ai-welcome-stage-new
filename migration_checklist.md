# Vetted AI - Supabase Migration Checklist

## Project Information
- **Source**: Lovable Cloud Supabase (vetted-ai-welcome-stage-new-audition-gen)
- **Target**: New Supabase Project (Staging + Production)
- **Migration Date**: 2025-11-05

## Overview
This checklist guides you through migrating your Vetted AI application from Lovable Cloud to a self-managed Supabase instance for both staging and production environments.

---

## Pre-Migration Preparation

### ✅ 1. Create New Supabase Projects

- [ ] **Staging Environment**
  - Go to [Supabase Dashboard](https://app.supabase.com/)
  - Create new project: `vetted-ai-staging`
  - Note the project URL: `https://[PROJECT_REF].supabase.co`
  - Note the `anon` public key
  - Note the `service_role` secret key
  - Save database password securely

- [ ] **Production Environment**
  - Create new project: `vetted-ai-production`
  - Note the project URL: `https://[PROJECT_REF].supabase.co`
  - Note the `anon` public key
  - Note the `service_role` secret key
  - Save database password securely

### ✅ 2. Export Current Data

- [ ] **Run Data Export Queries**
  - Open OLD Supabase project SQL Editor
  - Run each query from `data_export_queries.sql` (Section 1)
  - Copy and save JSON output for each table to separate files:
    - `admin_whitelist.json`
    - `recruiters.json`
    - `projects.json`
    - `role_definitions.json`
    - `audition_scaffolds.json`
    - `role_master_banks.json`
    - `archetypes.json`
    - `talent_profiles.json`
    - `evaluations.json`
    - `payments.json`
    - `analytics_events.json`
    - `notification_log.json`
    - `user_roles.json`

### ✅ 3. Export Auth Users

- [ ] **Export via Supabase Dashboard**
  - Go to OLD project → Authentication → Users
  - Export all users (Dashboard has export option)
  - Save as `auth_users.csv`

- [ ] **Alternative: Use Supabase CLI**
  ```bash
  supabase db dump --role-only > auth_users.sql
  ```

### ✅ 4. Export Storage Files

- [ ] **List all files in resumes bucket**
  ```sql
  SELECT name, id, bucket_id, created_at 
  FROM storage.objects 
  WHERE bucket_id = 'resumes'
  ORDER BY created_at;
  ```

- [ ] **Download resume files**
  - Option 1: Use Supabase Storage API to download each file
  - Option 2: Use Supabase CLI:
    ```bash
    supabase storage download resumes --project-ref [OLD_PROJECT_REF]
    ```

---

## Migration Execution

### ✅ 5. Apply Schema to New Projects

**For BOTH Staging and Production:**

- [ ] **Run schema.sql**
  - Open new project SQL Editor
  - Copy entire contents of `schema.sql`
  - Execute the query
  - Verify no errors (should see success messages)

- [ ] **Update webhook URL in schema**
  - Find `notify_sourcing_request_trigger()` function
  - Update `function_url` with your new project URL:
    ```sql
    function_url := 'https://[NEW_PROJECT_REF].supabase.co/functions/v1/fn_notify_sourcing_request';
    ```
  - Re-run the function definition

- [ ] **Verify schema installation**
  ```sql
  -- Check all tables exist
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name;
  
  -- Should return 13 tables
  ```

### ✅ 6. Import Data

**For BOTH Staging and Production:**

- [ ] **Import data in correct order** (respects foreign keys)
  
  1. **admin_whitelist** (no dependencies)
     ```sql
     INSERT INTO public.admin_whitelist (id, email, created_at)
     SELECT 
       (value->>'id')::uuid,
       value->>'email',
       (value->>'created_at')::timestamp with time zone
     FROM jsonb_array_elements('[PASTE_JSON_HERE]'::jsonb);
     ```

  2. **Import auth.users** (before recruiters)
     - Use Supabase Dashboard: Authentication → Users → Import
     - Upload `auth_users.csv`
     - Verify user count matches

  3. **recruiters** (depends on auth.users)
     ```sql
     INSERT INTO public.recruiters (...)
     SELECT ...
     FROM jsonb_array_elements('[PASTE_JSON_HERE]'::jsonb);
     ```

  4. **projects** (depends on recruiters)
  5. **role_definitions** (depends on projects)
  6. **audition_scaffolds** (depends on role_definitions)
  7. **role_master_banks** (no dependencies)
  8. **archetypes** (no dependencies)
  9. **talent_profiles** (depends on projects)
  10. **evaluations** (depends on projects)
  11. **payments** (depends on projects)
  12. **analytics_events** (depends on projects)
  13. **notification_log** (depends on projects)
  14. **user_roles** (depends on auth.users - LAST!)

- [ ] **Run verification queries** (from `data_export_queries.sql` Section 4)
  ```sql
  -- Count records in each table
  SELECT 'admin_whitelist' as table_name, COUNT(*) as record_count 
  FROM public.admin_whitelist
  UNION ALL
  SELECT 'recruiters', COUNT(*) FROM public.recruiters
  -- ... etc
  ```

- [ ] **Verify record counts match** OLD vs NEW project

### ✅ 7. Migrate Storage Files

**For BOTH Staging and Production:**

- [ ] **Upload resume files to new bucket**
  - Use Supabase Storage API or CLI
  - Maintain same folder structure: `resumes/[PROJECT_ID]/[filename]`
  
  ```bash
  # Using Supabase CLI
  supabase storage upload resumes [local_path] --project-ref [NEW_PROJECT_REF]
  ```

- [ ] **Verify file paths match** `talent_profiles.file_path` records

### ✅ 8. Deploy Edge Functions

**For BOTH Staging and Production:**

- [ ] **Copy edge functions from project**
  - `supabase/functions/fn_ai_question_factory/`
  - `supabase/functions/fn_notify_sourcing_request/`
  - `supabase/functions/parse-job-description/`
  - `supabase/functions/secure-shortlist-upload/`
  - `supabase/functions/fn_generate_role_definition/`
  - `supabase/functions/fn_generate_audition_scaffold/`

- [ ] **Initialize Supabase CLI in project**
  ```bash
  supabase login
  supabase link --project-ref [NEW_PROJECT_REF]
  ```

- [ ] **Deploy all edge functions**
  ```bash
  supabase functions deploy fn_ai_question_factory
  supabase functions deploy fn_notify_sourcing_request
  supabase functions deploy parse-job-description
  supabase functions deploy secure-shortlist-upload
  supabase functions deploy fn_generate_role_definition
  supabase functions deploy fn_generate_audition_scaffold
  ```

- [ ] **Verify functions are deployed**
  - Check Supabase Dashboard → Edge Functions
  - Should see all 6 functions listed

### ✅ 9. Configure Secrets

**For BOTH Staging and Production:**

- [ ] **Set edge function secrets**
  ```bash
  # Set Slack webhook URL
  supabase secrets set SLACK_SOURCING_WEBHOOK_URL="[YOUR_SLACK_WEBHOOK]"
  
  # Set Lovable API key (if used)
  supabase secrets set LOVABLE_API_KEY="[YOUR_API_KEY]"
  
  # Set Supabase keys (auto-available but verify)
  supabase secrets list
  ```

- [ ] **Verify secrets are set**
  ```bash
  supabase secrets list
  # Should show:
  # - SLACK_SOURCING_WEBHOOK_URL
  # - LOVABLE_API_KEY
  # - SUPABASE_URL (auto)
  # - SUPABASE_ANON_KEY (auto)
  # - SUPABASE_SERVICE_ROLE_KEY (auto)
  ```

---

## Application Configuration

### ✅ 10. Update Environment Variables

**For Staging Environment:**

- [ ] Create `.env.staging` file:
  ```env
  VITE_SUPABASE_URL=https://[STAGING_PROJECT_REF].supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=[STAGING_ANON_KEY]
  ```

**For Production Environment:**

- [ ] Create `.env.production` file:
  ```env
  VITE_SUPABASE_URL=https://[PRODUCTION_PROJECT_REF].supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=[PRODUCTION_ANON_KEY]
  ```

- [ ] Update deployment configuration (Vercel/Netlify/etc.)
  - Add environment variables to hosting platform
  - Create separate deployments for staging and production
  - Link staging branch to staging environment
  - Link main branch to production environment

### ✅ 11. Update Webhook URLs

- [ ] **Update Slack webhook configuration**
  - Find any hardcoded webhook URLs in code
  - Replace with environment-specific URLs if needed

- [ ] **Update notify_sourcing_request_trigger function**
  - Already done in Step 5, but verify the URL is correct:
  ```sql
  -- Verify function has correct URL
  SELECT prosrc 
  FROM pg_proc 
  WHERE proname = 'notify_sourcing_request_trigger';
  ```

---

## Testing & Verification

### ✅ 12. Test Authentication Flow

**Test in STAGING first:**

- [ ] **Sign Up Flow**
  - Create new user account
  - Verify user appears in auth.users
  - Verify recruiter profile auto-created

- [ ] **Sign In Flow**
  - Log in with test user
  - Verify session persists
  - Check JWT token includes correct claims

- [ ] **Admin Access** (if applicable)
  - Add test email to admin_whitelist
  - Create new user with that email
  - Verify user_roles entry created automatically
  - Test admin-only features

### ✅ 13. Test Core Workflows

**Test in STAGING:**

- [ ] **Project Creation**
  - Create new draft project
  - Verify project record created
  - Check `create_draft_project_v3()` function works

- [ ] **Role Definition Generation**
  - Upload job description
  - Trigger `fn_generate_role_definition` edge function
  - Verify role_definitions record created
  - Check definition_data JSONB structure

- [ ] **Audition Scaffold Generation**
  - Trigger `fn_generate_audition_scaffold` edge function
  - Verify audition_scaffolds record created
  - Check role_master_banks caching works

- [ ] **Resume Upload**
  - Upload test resume to project
  - Verify file in storage bucket
  - Check talent_profiles record created
  - Verify RLS policies allow access

- [ ] **Status Updates**
  - Update project status to 'awaiting_network_match'
  - Verify Slack notification sent
  - Check notification_log record created

- [ ] **Payment Flow** (if Stripe configured)
  - Test payment intent creation
  - Verify payments record created
  - Check payment_status updates correctly

### ✅ 14. Test RLS Policies

**Test in STAGING:**

- [ ] **Recruiter Isolation**
  - Create 2 test users
  - Create projects for each user
  - Verify User A cannot see User B's projects
  - Verify User A cannot see User B's resumes

- [ ] **Admin Access**
  - Log in as admin user
  - Verify admin can see all projects
  - Verify admin can update any project

- [ ] **Storage Policies**
  - Upload resume as User A
  - Try to access as User B (should fail)
  - Access as admin (should succeed)

### ✅ 15. Performance Testing

**Test in STAGING:**

- [ ] **Query Performance**
  ```sql
  -- Test slow queries
  EXPLAIN ANALYZE
  SELECT * FROM projects 
  WHERE recruiter_id = '[TEST_RECRUITER_ID]'
  ORDER BY created_at DESC;
  ```

- [ ] **Index Usage**
  ```sql
  -- Verify indexes are being used
  SELECT schemaname, tablename, indexname, idx_scan 
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
  ```

- [ ] **Load Testing**
  - Test concurrent project creation
  - Test bulk resume uploads
  - Monitor edge function execution times

---

## Production Deployment

### ✅ 16. Staging Sign-Off

- [ ] All tests pass in staging
- [ ] No data integrity issues
- [ ] All edge functions working
- [ ] RLS policies verified
- [ ] Performance acceptable
- [ ] Stakeholder approval obtained

### ✅ 17. Production Migration

- [ ] **Repeat Steps 5-11 for Production**
  - Use production environment variables
  - Double-check all configuration
  - Import production data (not staging test data)

- [ ] **Schedule maintenance window**
  - Notify users of migration
  - Set maintenance mode if needed

- [ ] **Execute production migration**
  - Run schema.sql
  - Import data
  - Deploy edge functions
  - Configure secrets
  - Update app environment variables

### ✅ 18. Production Verification

- [ ] **Smoke Tests**
  - [ ] User can sign in
  - [ ] User can create project
  - [ ] User can upload resumes
  - [ ] Admin can access ops console
  - [ ] Notifications working

- [ ] **Monitor for Errors**
  - Check Supabase logs for errors
  - Monitor edge function execution
  - Watch for RLS policy violations
  - Check application error logs

### ✅ 19. Rollback Plan (If Needed)

**If production migration fails:**

- [ ] **Immediate Actions**
  - Revert DNS/environment variables to old project
  - Notify users of temporary issues

- [ ] **Investigate Issues**
  - Check Supabase logs
  - Review error messages
  - Compare staging vs production config

- [ ] **Fix and Retry**
  - Address root cause
  - Test fix in staging
  - Schedule new production migration window

---

## Post-Migration

### ✅ 20. Monitoring Setup

- [ ] **Configure Supabase Monitoring**
  - Set up email alerts for errors
  - Monitor database performance
  - Track edge function execution times
  - Set up uptime monitoring

- [ ] **Application Monitoring**
  - Configure error tracking (Sentry, etc.)
  - Set up analytics
  - Monitor API response times

### ✅ 21. Optimize Performance

- [ ] **Review Query Performance**
  ```sql
  -- Find slow queries
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 20;
  ```

- [ ] **Add Missing Indexes** (if needed)
  - Monitor query plans
  - Add indexes for frequently queried columns

- [ ] **Configure Connection Pooling**
  - Review connection pool settings
  - Adjust max connections if needed

### ✅ 22. Security Audit

- [ ] **Run Supabase Linter**
  ```bash
  supabase db lint
  ```

- [ ] **Review RLS Policies**
  - Verify all tables have RLS enabled
  - Check for overly permissive policies
  - Test edge cases

- [ ] **Audit Admin Access**
  - Review admin_whitelist entries
  - Verify user_roles assignments
  - Check service_role key usage

### ✅ 23. Documentation

- [ ] **Update README**
  - Document new Supabase setup
  - Add environment variable instructions
  - Update deployment instructions

- [ ] **Create Runbook**
  - Common troubleshooting steps
  - Edge function debugging
  - Database maintenance tasks

- [ ] **Team Training**
  - Train team on new Supabase dashboard
  - Document access procedures
  - Share admin credentials securely

### ✅ 24. Cleanup

- [ ] **Archive Old Project Data**
  - Download final backup from Lovable Cloud
  - Store securely for historical reference

- [ ] **Update Project Configuration**
  - Remove Lovable Cloud references
  - Update repository documentation
  - Archive old environment files

- [ ] **Decommission Lovable Cloud** (when ready)
  - Verify all data migrated successfully
  - Cancel Lovable Cloud subscription
  - Delete old project (after retention period)

---

## Success Criteria

✅ **Migration Complete When:**

- [ ] All data successfully migrated (zero data loss)
- [ ] All authentication flows working
- [ ] All core features functional
- [ ] RLS policies preventing unauthorized access
- [ ] Edge functions executing successfully
- [ ] Webhooks/notifications working
- [ ] Storage files accessible
- [ ] Performance meets or exceeds old system
- [ ] Monitoring and alerts configured
- [ ] Team trained on new system
- [ ] Documentation updated
- [ ] Zero critical bugs in production for 7 days

---

## Emergency Contacts

- **Supabase Support**: support@supabase.com
- **Project Lead**: [Your Name]
- **DevOps Lead**: [Name]
- **Database Admin**: [Name]

---

## Notes & Issues

Use this section to track issues encountered during migration:

```
[Date] [Issue Description] [Resolution]
---
2025-11-05 | Example issue | Example resolution
```

---

## Migration Timeline

- **Preparation**: [Start Date] - [End Date]
- **Staging Migration**: [Date]
- **Staging Testing**: [Start Date] - [End Date]
- **Production Migration**: [Date]
- **Production Verification**: [Date]
- **Go Live**: [Date]

---

**Last Updated**: 2025-11-05
**Document Version**: 1.0
**Maintained By**: DevOps Team
