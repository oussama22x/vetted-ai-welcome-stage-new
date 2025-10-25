import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isReferralSource } from '@/constants/referralSources';
import type { User } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['admin', 'ops_manager']);

const deriveAdminFromMetadata = (user: User | null) => {
  if (!user) {
    return false;
  }

  const appMetadataRoles = user.app_metadata?.roles;
  if (Array.isArray(appMetadataRoles)) {
    if (appMetadataRoles.some((role) => typeof role === 'string' && ADMIN_ROLES.has(role))) {
      return true;
    }
  }

  const userMetadataRoles = user.user_metadata?.roles;
  if (Array.isArray(userMetadataRoles)) {
    if (userMetadataRoles.some((role) => typeof role === 'string' && ADMIN_ROLES.has(role))) {
      return true;
    }
  }

  const appMetadataRole = user.app_metadata?.role;
  if (typeof appMetadataRole === 'string' && ADMIN_ROLES.has(appMetadataRole)) {
    return true;
  }

  const userMetadataRole = user.user_metadata?.role;
  if (typeof userMetadataRole === 'string' && ADMIN_ROLES.has(userMetadataRole)) {
    return true;
  }

  return false;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      checkAdminRole(sessionUser);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      checkAdminRole(sessionUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (sessionUser: User | null) => {
    setLoading(true);

    if (!sessionUser) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const metadataAdmin = deriveAdminFromMetadata(sessionUser);
    setIsAdmin(metadataAdmin);

    try {
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Failed to check admin role via RPC', error);
        setIsAdmin(metadataAdmin);
        return;
      }

      setIsAdmin(Boolean(data) || metadataAdmin);
    } catch (error) {
      console.error('Unexpected error checking admin role', error);
      setIsAdmin(metadataAdmin);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (!error && data.user) {
      // Create recruiter profile
      await supabase.from('recruiters').insert({
        user_id: data.user.id,
        email: email,
        full_name: fullName
      });
    }

    return { data, error };
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };


  const completeSignUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName: string,
    userRole: string,
    companySize: string,
    referralSource?: string
  ) => {
    // First, create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName
        },
        emailRedirectTo: `${window.location.origin}/workspace`
      }
    });

    if (authError || !authData.user) {
      return { data: null, error: authError };
    }

    const sanitizedReferralSource = isReferralSource(referralSource) ? referralSource : null;

    const { error: recruiterError } = await supabase
      .from('recruiters')
      .upsert({
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        company_name: companyName,
        user_role: userRole,
        company_size: companySize,
        referral_source: sanitizedReferralSource,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    return { data: authData, error: recruiterError };
  };


  return { 
    user, 
    isAdmin, 
    loading, 
    signIn, 
    signUp, 
    signOut, 
    completeSignUp
  };
};
