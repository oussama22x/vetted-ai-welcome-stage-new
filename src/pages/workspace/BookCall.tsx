import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Calendar, Loader2, ArrowRight } from "lucide-react";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { normalizeProject, type Project, userProjectsQueryKey } from "@/hooks/useUserProjects";
import type { Database } from "@/integrations/supabase/types";

const LEMUEL_CALENDLY_URL = "https://calendly.com/lemuelabishua";
const TOBI_CALENDLY_URL = "https://cal.mixmax.com/ventureforafrica/antler_30";

const DEFAULT_TIER = {
  id: 1,
  name: "Founders Pilot",
  anchorPrice: 0,
  pilotPrice: 0,
};

type BookingAction = "lemuel" | "tobi";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export default function BookCall() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { wizardState, saveWizardState, clearWizardState } = useProjectWizard();
  const [loadingAction, setLoadingAction] = useState<BookingAction | null>(null);

  const jdContent = wizardState.jdContent || wizardState.jobDescription;

  const ensureRecruiterProfile = async () => {
    if (!user?.id) {
      throw new Error('You need to be signed in.');
    }

    // Check if recruiter profile exists
    const { data: recruiter, error: checkError } = await supabase
      .from('recruiters')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking recruiter profile:', checkError);
    }

    // If no recruiter profile, create one
    if (!recruiter) {
      const { error: createError } = await supabase
        .from('recruiters')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          status: 'active',
        });

      if (createError) {
        throw new Error('Failed to create recruiter profile. Please contact support.');
      }
    }
  };

  const ensureProject = async (): Promise<string> => {
    if (wizardState.projectId) {
      return wizardState.projectId;
    }

    if (!user?.id) {
      throw new Error('You need to be signed in to save your project.');
    }

    const roleTitle = wizardState.roleTitle?.trim() || 'Pending Role Title';
    const jobSummary = wizardState.jobSummary?.trim() || '';
    const jobDescription = jdContent || '';
    const candidateSource = wizardState.candidateSource || 'network';
    const candidateCount = candidateSource === 'own'
      ? wizardState.candidateCount || wizardState.uploadedResumes?.length || 0
      : wizardState.candidateCount || 0;

    // Use tier from wizard state if available, otherwise fallback to default
    const selectedTier = wizardState.selectedTier || DEFAULT_TIER;
    
    const { data: projectId, error } = await supabase
      .rpc('create_project_for_current_user', {
        p_role_title: roleTitle,
        p_job_summary: jobSummary,
        p_candidate_source: candidateSource,
        p_tier_name: selectedTier.name,
        p_tier_id: selectedTier.id,
        p_candidate_count: candidateCount,
      });

    if (error) {
      throw new Error(error.message || 'Failed to create project.');
    }

    if (!projectId) {
      throw new Error('Project could not be created.');
    }

    saveWizardState({ projectId: projectId as string });
    return projectId as string;
  };

  const finalizeProject = async (action: BookingAction) => {
    if (loadingAction) return;
    setLoadingAction(action);

    try {
      if (!user?.id) {
        throw new Error('You need to be signed in to complete this action.');
      }

      // Ensure recruiter profile exists before creating project
      await ensureRecruiterProfile();

      const projectId = await ensureProject();

      // Update project status directly
      const { error: statusError } = await supabase
        .from('projects')
        .update({ status: 'awaiting_setup_call' })
        .eq('id', projectId);

      if (statusError) {
        throw new Error(statusError.message || 'Failed to update project status.');
      }

      if (user?.id) {
        const { data: createdProject, error: fetchError } = await supabase
          .from('projects')
          .select('id, role_title, status, payment_status, candidate_count, created_at, tier_name')
          .eq('id', projectId)
          .maybeSingle<ProjectRow>();

        if (fetchError) {
          console.warn('Unable to fetch project after update', fetchError);
        } else if (createdProject) {
          queryClient.setQueryData<Project[]>(
            userProjectsQueryKey(user.id),
            (existing) => {
              const normalized = normalizeProject(createdProject);
              const withoutDuplicate = (existing || []).filter((project) => project.id !== normalized.id);
              return [normalized, ...withoutDuplicate];
            }
          );

          await queryClient.invalidateQueries({ queryKey: userProjectsQueryKey(user.id), exact: false });
        }
      }

      clearWizardState();

      const url = action === 'lemuel' ? LEMUEL_CALENDLY_URL : TOBI_CALENDLY_URL;
      window.open(url, '_blank', 'noopener,noreferrer');

      navigate('/workspace');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="text-sm text-muted-foreground">Final Step</div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5A4FCF] text-white">
            <Check className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl">Book Your Setup Call</CardTitle>
          <p className="text-lg text-muted-foreground">
            During the call, we'll discuss your proof of work task and evaluation criteria to ensure the perfect fit for your role.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full py-6 text-lg"
              onClick={() => finalizeProject('lemuel')}
              disabled={!!loadingAction}
            >
              {loadingAction === 'lemuel' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-5 w-5" />
              )}
              Book Call with Lemuel
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full py-6 text-lg"
              onClick={() => finalizeProject('tobi')}
              disabled={!!loadingAction}
            >
              {loadingAction === 'tobi' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              Book Call with Tobi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
