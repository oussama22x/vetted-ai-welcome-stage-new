import { useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

type RawProject = Database['public']['Functions']['get_projects_for_current_user']['Returns'][number];

type NormalizableProject = Pick<RawProject, 'id' | 'role_title' | 'status' | 'payment_status'> & {
  candidate_count?: number | null;
  created_at?: string | null;
  tier_name?: string | null;
};

export interface Project {
  id: string;
  role_title: string;
  status: string;
  payment_status: string;
  candidate_count: number;
  created_at: string;
  tier_name?: string | null;
}

export const userProjectsQueryKey = (userId?: string) => ['user-projects', userId] as const;

export const normalizeProject = (project: NormalizableProject): Project => ({
  id: project.id,
  role_title: project.role_title,
  status: project.status,
  payment_status: project.payment_status,
  candidate_count: project.candidate_count ?? 0,
  created_at: project.created_at ?? new Date().toISOString(),
  tier_name: project.tier_name ?? null,
});

export const useUserProjects = () => {
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) {
      console.log('No user authenticated, skipping project fetch');
      return [];
    }

    console.log('Fetching projects for user:', user.id);

    const { data, error } = await supabase
      .rpc('get_projects_for_current_user');

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    const normalizedProjects: Project[] = (data || []).map(normalizeProject);

    console.log('Projects fetched:', normalizedProjects.length);
    return normalizedProjects;
  };

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: userProjectsQueryKey(user?.id),
    queryFn: fetchProjects,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription for projects
    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          console.log('Projects table changed, refetching...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return { projects, isLoading, refetch };
};
