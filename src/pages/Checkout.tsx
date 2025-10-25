import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { WizardState } from "@/hooks/useProjectWizard";
import { PaymentSuccess } from "@/components/checkout/PaymentSuccess";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeProject, userProjectsQueryKey, type Project } from "@/hooks/useUserProjects";
import type { Database } from "@/integrations/supabase/types";

type ProjectRow = Database['public']['Tables']['projects']['Row'];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wizardState = useMemo(() => {
    const stateWizard = (location.state as { wizardState?: WizardState })?.wizardState;

    if (stateWizard?.selectedTier) {
      return stateWizard;
    }

    const stored = sessionStorage.getItem('project_wizard_state');
    if (!stored) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(stored) as WizardState;
      return parsed?.selectedTier ? parsed : undefined;
    } catch (error) {
      console.warn('Failed to parse stored wizard state', error);
      return undefined;
    }
  }, [location.state]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!wizardState || !wizardState.selectedTier) {
      navigate('/workspace');
    }
  }, [wizardState, navigate]);

  if (!wizardState || !wizardState.selectedTier) {
    return null;
  }

  const { selectedTier, roleTitle, candidateCount, candidateSource } = wizardState;

  const candidatePoolText = candidateSource === 'own' 
    ? `${candidateCount} Candidates`
    : 'VettedAI Network';

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Starting project creation...');
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to create a project');
      }

      console.log('User authenticated:', user.id);

      // Validate wizard state
      const hasMissingCount =
        candidateCount === undefined || candidateCount === null;

      if (!roleTitle || !selectedTier || hasMissingCount) {
        console.error('Incomplete wizard state:', wizardState);
        throw new Error('Please complete all project details before proceeding');
      }

      // Create project using server-side RPC
      const { data: projectId, error: projectError } = await supabase
        .rpc('create_project_for_current_user', {
          p_role_title: roleTitle,
          p_job_summary: wizardState.jobSummary || '',
          p_candidate_source: candidateSource || 'own',
          p_tier_name: selectedTier.name,
          p_tier_id: parseInt(selectedTier.id.toString()),
          p_candidate_count: candidateCount || 0,
        });

      if (projectError) {
        console.error('Error creating project:', projectError);
        throw new Error(projectError.message.includes('No recruiter profile')
          ? 'Recruiter profile not found. Please complete your profile setup.'
          : `Failed to create project: ${projectError.message}`);
      }

      if (!projectId) {
        console.error('No project ID returned');
        throw new Error('Project creation failed - no ID returned');
      }

      console.log('Project created successfully:', projectId);
      setCreatedProjectId(projectId);

      // Mark project as paid and ready for vetting when checkout completes
      const { error: statusUpdateError } = await supabase
        .from('projects')
        .update({ status: 'awaiting', payment_status: 'paid' })
        .eq('id', projectId);

      if (statusUpdateError) {
        console.warn('Failed to update project status after checkout:', statusUpdateError);
      }

      // Ensure the recruiter dashboard reflects the new project immediately
      if (user?.id) {
        const { data: createdProject, error: fetchProjectError } = await supabase
          .from('projects')
          .select('id, role_title, status, payment_status, candidate_count, created_at, tier_name')
          .eq('id', projectId)
          .maybeSingle<ProjectRow>();

        if (fetchProjectError) {
          console.warn('Failed to fetch created project for cache hydration:', fetchProjectError);
        } else if (createdProject) {
          queryClient.setQueryData<Project[]>(
            userProjectsQueryKey(user.id),
            (existing) => {
              const normalized = normalizeProject({
                ...createdProject,
                status: statusUpdateError ? createdProject.status : 'awaiting',
                payment_status: statusUpdateError ? createdProject.payment_status : 'paid',
              });
              const withoutDuplicate = (existing || []).filter((project) => project.id !== normalized.id);
              return [normalized, ...withoutDuplicate];
            }
          );
        }

        await queryClient.invalidateQueries({ queryKey: userProjectsQueryKey(user.id), exact: false });
      }

      // Log analytics event (non-blocking)
      try {
        await supabase.from('analytics_events').insert({
          event_type: 'project_created',
          user_id: user.id,
          project_id: projectId,
          metadata: {
            tier: selectedTier.name,
            candidate_count: candidateCount,
          },
        });
      } catch (analyticsError) {
        console.warn('Analytics logging failed:', analyticsError);
      }
      
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating project:', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to create project. Please try again or contact support.';
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueToFolder = async () => {
    sessionStorage.removeItem('project_wizard_state');
    if (user?.id) {
      await queryClient.refetchQueries({ queryKey: userProjectsQueryKey(user.id), type: 'all' });
    }

    navigate('/workspace', {
      state: {
        refetch: true,
        refetchToken: Date.now(),
        lastCreatedProjectId: createdProjectId,
      },
    });
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          <PaymentSuccess onContinue={handleContinueToFolder} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pilot Checkout – Validation Build</h1>
          <p className="text-muted-foreground">Confirm your order and proceed to payment</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
          <div className="space-y-6 text-center pb-6 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Regular Price</p>
              <p className="text-4xl text-muted-foreground line-through">
                ${selectedTier.anchorPrice}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Your Pilot Price</p>
              <div className="flex items-baseline justify-center gap-2">
                <p className="text-6xl font-bold text-primary">
                  ${selectedTier.pilotPrice}
                </p>
                <span className="text-sm text-muted-foreground">(one-time)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Project Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{roleTitle}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Vetting Tier:</span>
                <span className="font-medium">{selectedTier.name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Candidates:</span>
                <span className="font-medium">{candidatePoolText}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Delivery SLA:</span>
                <span className="font-medium">48-72 hours to verified shortlist</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              size="lg" 
              className="w-full gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  Proceed to Secure Payment
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Pilot pricing helps us prioritize your shortlist and deliver exceptional results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
