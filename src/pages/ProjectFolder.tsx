import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ProjectLayout } from "@/components/project/ProjectLayout";
import { RoleSummaryCard } from "@/components/project/RoleSummaryCard";
import { CandidateCard } from "@/components/project/CandidateCard";
import { EmptyState } from "@/components/project/EmptyState";
import { CandidateEngagementTracker } from "@/components/project/CandidateEngagementTracker";
import { CandidateListTable } from "@/components/project/CandidateListTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjectState, CandidateInfo } from "@/hooks/useProjectState";
import { TierInfo, UploadedFile } from "@/hooks/useChatFlow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFolderState {
  projectId: string;
  roleTitle: string;
  tier: TierInfo;
  candidateSource: 'own' | 'network';
  candidateCount: number;
  uploadedResumes?: UploadedFile[];
  status: 'pending' | 'awaiting_setup_call' | 'awaiting' | 'scoring' | 'ready' | 'pending_activation' | 'activation_in_progress' | 'in_progress' | 'completed';
  paymentStatus: 'paid' | 'pending';
  progress: {
    hoursElapsed: number;
    totalHours: 48;
    percentage: number;
  };
}

const ProjectFolder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const state = location.state as ProjectFolderState;
  const { toast } = useToast();
  
  const { project, parseCandidatesFromFiles } = useProjectState(state);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCandidateList, setShowCandidateList] = useState(false);
  const [candidateData, setCandidateData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    if (!state && !projectId) {
      navigate('/workspace');
    }
    
    if (projectId) {
      fetchProjectData();
      fetchCandidates();
    }
  }, [state, projectId, navigate]);

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
          setProjectData((prev: any) => ({
            ...prev,
            candidates_completed: payload.new.candidates_completed,
            total_candidates: payload.new.total_candidates,
            completion_percentage: payload.new.completion_percentage
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchProjectData = async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.error('Error fetching project:', error);
      return;
    }
    
    setProjectData(data);
  };

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

  if (!state && !projectData) {
    return null;
  }

  const displayProject = projectData || project;
  const candidates: CandidateInfo[] = state?.uploadedResumes 
    ? parseCandidatesFromFiles(state.uploadedResumes)
    : [];

  const showCandidates = (state?.candidateSource === 'own' || displayProject?.candidate_source === 'own') && (candidates.length > 0 || candidateData.length > 0);

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
          <span className="font-medium">{displayProject?.role_title || displayProject?.roleTitle}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Role Summary & Engagement */}
          <div className="lg:col-span-1 space-y-6">
            <RoleSummaryCard
              roleTitle={displayProject?.role_title || displayProject?.roleTitle}
              tier={displayProject?.tier || project.tier}
              candidateSource={displayProject?.candidate_source || displayProject?.candidateSource}
              candidateCount={displayProject?.candidate_count || displayProject?.candidateCount}
              status={displayProject?.status}
              progress={displayProject?.progress || project.progress}
            />

            {projectData && (
              <CandidateEngagementTracker
                candidatesCompleted={projectData.candidates_completed || 0}
                totalCandidates={projectData.total_candidates || 0}
                completionPercentage={projectData.completion_percentage || 0}
              />
            )}
          </div>

          {/* Right Panel - Candidates */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Candidates</h3>
                {(displayProject?.candidate_source === 'own' || state?.candidateSource === 'own') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCandidates}
                    disabled={(displayProject?.candidate_count || project.candidateCount) >= 50}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add More ({displayProject?.candidate_count || project.candidateCount}/50)
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

              {showCandidates && candidates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      fileName={candidate.fileName}
                      parsedName={candidate.parsedName}
                      status={candidate.status}
                    />
                  ))}
                </div>
              ) : candidateData.length === 0 ? (
                <EmptyState />
              ) : null}

              {displayProject?.status === 'ready' && (
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
              Current: {displayProject?.candidate_count || project.candidateCount}/50
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

export default ProjectFolder;
