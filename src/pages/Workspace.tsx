import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { ProgressIndicator } from "@/components/workspace/ProgressIndicator";
import { ChatContainer } from "@/components/workspace/ChatContainer";
import { ChatMessage } from "@/components/workspace/ChatMessage";
import { NavigationControls } from "@/components/workspace/NavigationControls";
import { JobDescriptionStep } from "@/components/workspace/steps/JobDescriptionStep";
import { JDConfirmationStep } from "@/components/workspace/steps/JDConfirmationStep";
import { CandidateSourceStepV2 } from "@/components/workspace/steps/CandidateSourceStepV2";
import { CandidatePreviewStep } from "@/components/workspace/steps/CandidatePreviewStep";
import { TierSelectionStep } from "@/components/workspace/steps/TierSelectionStep";
import { ReviewProjectStep } from "@/components/workspace/steps/ReviewProjectStep";
import { Button } from "@/components/ui/button";
import { useChatFlow } from "@/hooks/useChatFlow";
import { useUserProjects, type Project } from "@/hooks/useUserProjects";
import type { WizardState } from "@/hooks/useProjectWizard";
import { format } from "date-fns";

const Workspace = () => {
  const navigate = useNavigate();
  const { projects, isLoading: isLoadingProjects } = useUserProjects();
  const visibleProjects = useMemo(() => projects.slice(0, 3), [projects]);

  const {
    state,
    addMessage,
    setTyping,
    updateJobDescription,
    updateJDConfirmation,
    updateCandidateSource,
    confirmCandidateExperience,
    updateSelectedTier,
    goToStep,
    goToPreviousStep,
    goToNextStep,
    canGoBack,
    canGoForward,
  } = useChatFlow();

  const handleJobDescriptionComplete = (jd: string, summary: string, jobTitle: string) => {
    updateJobDescription(jd, summary, jobTitle);
  };

  const handleJDConfirmationComplete = (roleTitle: string, summary: string) => {
    updateJDConfirmation(roleTitle, summary);
  };

  const handleCandidateSourceComplete = (source: 'own' | 'network', files?: any[]) => {
    updateCandidateSource(source, files);
  };

  const handleCandidatePreviewComplete = () => {
    confirmCandidateExperience();
  };

  const handleTierSelectionComplete = (tier: any) => {
    updateSelectedTier(tier);
  };

  const handleProceedToCheckout = () => {
    if (!state.selectedTier) {
      return;
    }

    const wizardState: WizardState = {
      roleTitle: state.jobTitle,
      jobSummary: state.jobSummary,
      jobDescription: state.jobDescription,
      candidateSource: state.candidateSource ?? undefined,
      uploadedResumes: state.uploadedResumes?.map((file) => ({
        name: file.name,
        size: file.size,
        status: file.status,
        progress: file.progress,
      })),
      candidateCount: state.candidateCount,
      selectedTier: state.selectedTier,
    };

    sessionStorage.setItem('project_wizard_state', JSON.stringify(wizardState));

    navigate('/checkout', {
      state: { wizardState },
    });
  };

  const handleEditFromReview = (step: number) => {
    goToStep(step);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7]">
      <WorkspaceHeader />
      <ProgressIndicator currentStep={state.currentStep} totalSteps={6} />
      
      <ChatContainer
        messages={state.messages}
        isTyping={state.isTyping}
      >
        {isLoadingProjects ? (
          <ChatMessage
            type="assistant"
            content="Fetching your existing projects..."
          />
        ) : visibleProjects.length > 0 ? (
          <ChatMessage
            type="assistant"
            content={(
              <WorkspaceProjects
                projects={visibleProjects}
                totalProjects={projects.length}
                onOpenProject={(projectId) => navigate(`/workspace/project/${projectId}`)}
              />
            )}
          />
        ) : null}

        {state.currentStep === 1 && (
          <JobDescriptionStep
            onComplete={handleJobDescriptionComplete}
            onAddMessage={addMessage}
            onSetTyping={setTyping}
          />
        )}

        {state.currentStep === 2 && (
          <JDConfirmationStep
            initialRoleTitle={state.jobTitle}
            initialSummary={state.jobSummary}
            onComplete={handleJDConfirmationComplete}
            onAddMessage={addMessage}
          />
        )}

        {state.currentStep === 3 && (
          <CandidateSourceStepV2 
            onComplete={handleCandidateSourceComplete}
            onAddMessage={addMessage}
          />
        )}

        {state.currentStep === 4 && (
          <CandidatePreviewStep 
            onComplete={handleCandidatePreviewComplete}
            onAddMessage={addMessage}
          />
        )}

        {state.currentStep === 5 && (
          <TierSelectionStep
            candidateCount={state.candidateCount || 12}
            onComplete={handleTierSelectionComplete}
            onAddMessage={addMessage}
          />
        )}

        {state.currentStep === 6 && state.selectedTier && (
          <ReviewProjectStep
            roleTitle={state.jobTitle || 'Role Title'}
            jobSummary={state.jobSummary || 'No summary available'}
            candidateSource={state.candidateSource || 'network'}
            candidateCount={state.candidateCount || 0}
            tier={state.selectedTier}
            onComplete={handleProceedToCheckout}
            onEdit={handleEditFromReview}
          />
        )}
      </ChatContainer>

      <NavigationControls
        canGoBack={canGoBack()}
        canGoForward={canGoForward()}
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        currentStep={state.currentStep}
        totalSteps={6}
      />
    </div>
  );
};

export default Workspace;

interface WorkspaceProjectsProps {
  projects: Project[];
  totalProjects: number;
  onOpenProject: (projectId: string) => void;
}

const WorkspaceProjects = ({ projects, totalProjects, onOpenProject }: WorkspaceProjectsProps) => {
  const pluralizedCount = totalProjects === 1 ? "project" : "projects";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Your saved vetting {pluralizedCount}</p>
        <p className="text-sm text-muted-foreground">
          You can revisit an existing folder or continue below to start another project.
        </p>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{project.role_title}</p>
                <p className="text-xs text-muted-foreground">
                  Created on {format(new Date(project.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-medium text-foreground capitalize">{project.status}</span>
                  {project.tier_name && (
                    <span className="text-muted-foreground">
                      {" "}• Tier {project.tier_name}
                    </span>
                  )}
                </p>
              </div>

              <Button
                onClick={() => onOpenProject(project.id)}
                size="sm"
                className="self-start sm:self-auto"
              >
                Open Folder →
              </Button>
            </div>
          </div>
        ))}

        {totalProjects > projects.length && (
          <p className="text-xs text-muted-foreground">
            Showing {projects.length} of {totalProjects} {pluralizedCount}. Visit your dashboard to view them all.
          </p>
        )}
      </div>
    </div>
  );
};
