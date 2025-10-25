import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectFilters {
  status?: string;
  tierId?: number;
  search?: string;
  sortBy?: 'created_at' | 'sla_deadline';
}

export const useProjects = (filters?: ProjectFilters) => {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          recruiter:recruiters!inner(id, full_name, email, organization:organizations(name)),
          talent_profiles(count)
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.tierId) {
        query = query.eq('tier_id', filters.tierId);
      }
      if (filters?.search) {
        query = query.or(`role_title.ilike.%${filters.search}%`);
      }

      const sortColumn = filters?.sortBy || 'created_at';
      query = query.order(sortColumn, { ascending: sortColumn === 'sla_deadline' });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'ready' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('analytics_events').insert({
        event_type: 'ops_status_changed',
        project_id: projectId,
        metadata: { new_status: status }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    }
  });
};

export const useResumes = (projectId: string) => {
  return useQuery({
    queryKey: ['resumes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });
};
