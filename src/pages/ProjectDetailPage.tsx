import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectLayout } from "@/components/project/ProjectLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import type { ProjectDetail } from "./project-detail/types";

const statusLabels: Record<string, string> = {
  awaiting: "Awaiting Candidates",
  awaiting_network_match: "Sourcing via Network",
  draft: "Draft",
  inviting: "Inviting Candidates",
  scoring: "Scoring in Progress",
  ready: "Shortlist Ready",
};

const fetchProject = async (projectId: string): Promise<ProjectDetail> => {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
        id,
        role_title,
        status,
        created_at,
        shareable_link_id,
        job_summary,
        candidate_source,
        tier_name,
        candidate_count,
        payment_status,
        hours_elapsed,
        candidates_completed,
        total_candidates,
        completion_percentage,
        recruiters (
          company_name
        ),
        role_definitions (
          id,
          definition_data,
          audition_scaffolds (
            id,
            scaffold_preview_html,
            scaffold_data
          )
        )
      `
    )
    .eq("id", projectId)
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to load project");
  }

  return data as ProjectDetail;
};

const getStatusLabel = (status: string | null | undefined) => {
  if (!status) return "In Progress";
  return statusLabels[status] ?? "In Progress";
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery<ProjectDetail, Error>({
    queryKey: ["project-detail", projectId],
    enabled: Boolean(projectId),
    queryFn: () => {
      if (!projectId) {
        throw new Error("A project identifier is required.");
      }

      return fetchProject(projectId);
    },
    retry: 1,
  });

  const roleDefinition = project?.role_definitions ?? null;
  const auditionScaffold = roleDefinition?.audition_scaffolds ?? null;
  const dimensionJustification = useMemo(() => {
    const justification = auditionScaffold?.scaffold_data?.dimension_justification;

    if (typeof justification === "string") {
      const trimmed = justification.trim();
      return trimmed.length ? trimmed : null;
    }

    if (justification === null || justification === undefined) {
      return null;
    }

    const fallback = String(justification).trim();
    return fallback.length ? fallback : null;
  }, [auditionScaffold?.scaffold_data?.dimension_justification]);
  const companyName = project?.recruiters?.company_name?.trim() || null;
  const shareableLink = useMemo(() => {
    if (!project?.shareable_link_id) {
      return null;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/auditions/${project.shareable_link_id}`;
  }, [project?.shareable_link_id]);

  const handleCopyLink = useCallback(async () => {
    if (!shareableLink) {
      return;
    }

    if (!navigator?.clipboard) {
      toast({
        title: "Clipboard unavailable",
        description: "Please copy the audition link manually.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareableLink);
      toast({
        title: "Link copied",
        description: "The audition link has been copied to your clipboard.",
      });
    } catch (copyError) {
      toast({
        title: "Unable to copy link",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
      console.error(copyError);
    }
  }, [shareableLink, toast]);

  const renderCandidateStatus = () => {
    switch (project?.status) {
      case "awaiting":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your Audition is ready to be shared with candidates.
              </p>
              {shareableLink ? (
                <div className="space-y-2 rounded-lg border border-muted px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Shareable Link
                      </p>
                      <p className="break-all text-sm font-medium text-foreground">
                        {shareableLink}
                      </p>
                    </div>
                    <Button size="sm" onClick={handleCopyLink}>
                      Copy Link
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A shareable link will appear here once this Audition is ready to send.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Candidate status tracking will appear here once invitations are sent.
            </p>
          </div>
        );
      case "awaiting_network_match":
        return (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              VettedAI is sourcing candidates based on this Audition. We'll update this space and notify you when your shortlist of
              vetted candidates is ready.
            </p>
            <p>Shortlist details will appear here.</p>
          </div>
        );
      case "draft":
        return (
          <p className="text-sm text-muted-foreground">
            This Audition draft has not been approved yet. Please complete the generation process.
          </p>
        );
      case "inviting":
        return (
          <p className="text-sm text-muted-foreground">
            Candidate invitations are being sent. Tracking details will populate here shortly.
          </p>
        );
      case "scoring":
        return (
          <p className="text-sm text-muted-foreground">
            Candidates are completing the Audition. Scoring insights will appear here soon.
          </p>
        );
      case "ready":
        return (
          <p className="text-sm text-muted-foreground">
            Your shortlist is ready. Review details will be available in this section.
          </p>
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            Updates about candidate progress for this Audition will appear here.
          </p>
        );
    }
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
        <h1 className="text-2xl font-semibold">We couldn't load this audition</h1>
        <p className="max-w-md text-muted-foreground">
          {error?.message ?? "The project you're looking for might have been removed or you may not have permission to view it."}
        </p>
        <Button onClick={() => navigate("/workspace")}>Back to Workspace</Button>
      </div>
    );
  }

  const statusLabel = getStatusLabel(project.status);

  return (
    <ProjectLayout>
      <TooltipProvider>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                className="w-fit gap-2"
                onClick={() => navigate("/workspace")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to All Projects
              </Button>
              <Badge variant="secondary" className="text-sm">
                {statusLabel}
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-foreground">{project.role_title}</h1>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{companyName ?? "Company TBD"}</p>
                {project.created_at && (
                  <p>Created on {format(new Date(project.created_at), "MMM d, yyyy")}</p>
                )}
              </div>
            </div>
          </header>

          <section>
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Approved Audition Outline</CardTitle>
                  <CardDescription>
                    The experience candidates will complete when participating in this Audition.
                  </CardDescription>
                </div>
                <Button variant="link" className="px-0" disabled>
                  View Role DNA
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {auditionScaffold?.scaffold_preview_html ? (
                  <div
                    className="prose max-w-none rounded-lg border bg-card/60 px-6 py-5 text-sm"
                    dangerouslySetInnerHTML={{ __html: auditionScaffold.scaffold_preview_html }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The audition outline will appear here once it has been approved.
                  </p>
                )}

                <div className="space-y-2 rounded-lg border border-dashed border-muted bg-muted/40 px-4 py-3">
                  <h3 className="text-sm font-medium text-foreground">Rationale:</h3>
                  <p className="text-sm text-muted-foreground">
                    {dimensionJustification ??
                      "Context for this audition's dimensions will appear here."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle>Candidate Progress</CardTitle>
                <CardDescription>
                  Monitor how candidates are moving through this Audition.
                </CardDescription>
              </CardHeader>
              <CardContent>{renderCandidateStatus()}</CardContent>
            </Card>
          </section>
        </div>
      </TooltipProvider>
    </ProjectLayout>
  );
};

export default ProjectDetailPage;
