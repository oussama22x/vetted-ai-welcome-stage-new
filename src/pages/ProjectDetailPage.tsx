import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Upload, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProjectLayout } from "@/components/project/ProjectLayout";
import { RoleSummaryCard } from "@/components/project/RoleSummaryCard";
import { CandidateEngagementTracker } from "@/components/project/CandidateEngagementTracker";
import { CandidateListTable } from "@/components/project/CandidateListTable";
import { EmptyState } from "@/components/project/EmptyState";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ActivationInProgressView from "./project-detail/ActivationInProgressView";
import PendingActivationView from "./project-detail/PendingActivationView";
import type { ProjectDetail } from "./project-detail/types";

const STATUS_PENDING_ACTIVATION = "pending_activation";
const STATUS_ACTIVATION_IN_PROGRESS = "activation_in_progress";

const fetchProject = async (projectId: string): Promise<ProjectDetail> => {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, role_title, status, job_summary, candidate_source, tier_name, candidate_count, created_at, payment_status, hours_elapsed, candidates_completed, total_candidates, completion_percentage"
    )
    .eq("id", projectId)
    .single<ProjectDetail>();

  if (error) {
    throw error;
  }

  return data;
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [candidateData, setCandidateData] = useState<any[]>([]);
  const [showCandidateList, setShowCandidateList] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId],
    enabled: Boolean(projectId),
    queryFn: () => {
      if (!projectId) {
        throw new Error("A project identifier is required.");
      }

      return fetchProject(projectId);
    },
  });

  useEffect(() => {
    if (projectId && project && !['pending_activation', 'activation_in_progress'].includes(project.status)) {
      fetchCandidates();
    }
  }, [projectId, project]);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('project_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, refetch]);

  const fetchCandidates = async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from('talent_profiles')
      .select('id, parsed_name, parsed_email, status')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching candidates:', error);
      return;
    }
    
    setCandidateData(data || []);
  };

  const handleAddCandidates = () => {
    setShowUploadModal(true);
  };

  const handleSubmitCandidates = () => {
    toast({
      title: "Candidates uploaded",
      description: "Your candidates have been added successfully."
    });
    setShowUploadModal(false);
    fetchCandidates();
  };

  const handleConfirmActivation = async () => {
    if (!projectId) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from("projects")
      .update({ status: STATUS_ACTIVATION_IN_PROGRESS })
      .eq("id", projectId);

    if (error) {
      toast({
        title: "Unable to update project",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
      setIsUpdating(false);
      return;
    }

    toast({
      title: "Setup call confirmed",
      description: "Thanks for confirming—your activation is underway.",
    });

    await refetch();
    setIsUpdating(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <span className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading project details...
        </span>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-2xl font-semibold">We couldn't find that project</h1>
        <p className="max-w-md text-muted-foreground">
          The project you're looking for might have been removed or you may not have permission to view it.
        </p>
        <Button onClick={() => navigate("/workspace")}>Back to Workspace</Button>
      </div>
    );
  }

  if (project.status === STATUS_PENDING_ACTIVATION) {
    return (
      <PendingActivationView
        project={project}
        onBack={() => navigate("/workspace")}
        onConfirmActivation={handleConfirmActivation}
        isConfirming={isUpdating}
      />
    );
  }

  if (project.status === STATUS_ACTIVATION_IN_PROGRESS) {
    return <ActivationInProgressView project={project} onBack={() => navigate("/workspace")} />;
  }

  // For all other statuses, show the full project view
  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Button 
            variant="link" 
            onClick={() => navigate('/workspace')}
            className="p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            ← My Workspace
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{project.role_title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Role Summary & Engagement */}
          <div className="lg:col-span-1 space-y-6">
            <RoleSummaryCard
              roleTitle={project.role_title}
              tier={{ name: project.tier_name } as any}
              candidateSource={project.candidate_source as 'own' | 'network'}
              candidateCount={project.candidate_count || 0}
              status={project.status as any}
              progress={{
                hoursElapsed: project.hours_elapsed || 0,
                totalHours: 48,
                percentage: Math.min(((project.hours_elapsed || 0) / 48) * 100, 100)
              }}
            />

            <CandidateEngagementTracker
              candidatesCompleted={project.candidates_completed || 0}
              totalCandidates={project.total_candidates || 0}
              completionPercentage={project.completion_percentage || 0}
            />
          </div>

          {/* Right Panel - Candidates */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Candidates</h3>
                {project.candidate_source === 'own' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCandidates}
                    disabled={(project.candidate_count || 0) >= 50}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add More ({project.candidate_count || 0}/50)
                  </Button>
                )}
              </div>

              {candidateData.length > 0 && (
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCandidateList(!showCandidateList)}
                    className="w-full mb-4"
                  >
                    {showCandidateList ? 'Hide' : 'View'} Candidate List
                    <ChevronDown className={cn(
                      "w-4 h-4 ml-2 transition-transform",
                      showCandidateList && "rotate-180"
                    )} />
                  </Button>

                  {showCandidateList && (
                    <CandidateListTable candidates={candidateData} />
                  )}
                </div>
              )}

              {candidateData.length === 0 && <EmptyState />}

              {project.status === 'ready' && (
                <div className="mt-8 pt-6 border-t border-border">
                  <Button size="lg" className="w-full">
                    View Shortlist →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add More Candidates</DialogTitle>
            <DialogDescription>
              Upload additional candidates for this project. 
              Current: {project.candidate_count || 0}/50
            </DialogDescription>
          </DialogHeader>
          
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>File upload functionality to be implemented</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCandidates}>
              Upload Candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
};

export default ProjectDetailPage;
