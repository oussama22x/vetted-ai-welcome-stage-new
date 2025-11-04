import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Brain, Zap, MessageSquare, Lightbulb, Heart, Scale, HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProjectLayout } from "@/components/project/ProjectLayout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
        job_summary,
        candidate_source,
        tier_name,
        candidate_count,
        payment_status,
        hours_elapsed,
        candidates_completed,
        total_candidates,
        completion_percentage,
        company_name,
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

  const questionsByDimension = useMemo(() => {
    const scaffoldData = auditionScaffold?.scaffold_data as any;
    const questions = scaffoldData?.questions;
    if (!questions || !Array.isArray(questions)) return {};
    
    return questions.reduce((acc: any, question: any) => {
      const dim = question.dimension || 'other';
      if (!acc[dim]) acc[dim] = [];
      acc[dim].push(question);
      return acc;
    }, {} as Record<string, any[]>);
  }, [auditionScaffold?.scaffold_data]);

  const bankId = (auditionScaffold?.scaffold_data as any)?.bank_id;
  const cacheHit = (auditionScaffold?.scaffold_data as any)?.cache_hit;

  const dimensionWeights = useMemo(() => {
    const defData = roleDefinition?.definition_data as any;
    return defData?.weighted_dimensions?.weights;
  }, [roleDefinition?.definition_data]);

  const dimensionRationale = useMemo(() => {
    const defData = roleDefinition?.definition_data as any;
    const rationale = defData?.weighted_dimensions?.rationale;
    if (typeof rationale === 'string') {
      return rationale.trim() || null;
    }
    return null;
  }, [roleDefinition?.definition_data]);

  const dimensionConfig: Record<string, { label: string; icon: any; color: string }> = {
    cognitive: { label: 'Cognitive', icon: Brain, color: 'text-blue-500' },
    execution: { label: 'Execution', icon: Zap, color: 'text-yellow-500' },
    communication_collaboration: { label: 'Communication & Collaboration', icon: MessageSquare, color: 'text-green-500' },
    adaptability_learning: { label: 'Adaptability & Learning', icon: Lightbulb, color: 'text-purple-500' },
    emotional_intelligence: { label: 'Emotional Intelligence', icon: Heart, color: 'text-pink-500' },
    judgment_ethics: { label: 'Judgment & Ethics', icon: Scale, color: 'text-indigo-500' },
  };


  const companyName = useMemo(() => {
    const raw = project?.company_name ?? "";
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }, [project?.company_name]);

  const companyDisplay = companyName ?? "Company TBD";
  const renderCandidateStatus = () => {
    switch (project?.status) {
      case "awaiting":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your Audition is ready to be shared with candidates. <span className="font-medium text-foreground">(Shareable link coming soon)</span>
              </p>
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-8">
          <header className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                className="w-fit gap-2"
                onClick={() => navigate("/workspace")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to All Projects
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {project.role_title}
                </h1>
                <Badge variant="secondary" className="self-start text-sm sm:self-auto">
                  {statusLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className={companyName ? "font-medium text-foreground" : "italic"}>
                  {companyDisplay}
                </span>
                {project.created_at && (
                  <span>Created on {format(new Date(project.created_at), "MMM d, yyyy")}</span>
                )}
              </div>
            </div>
          </header>

          <section>
            <Card>
              <CardHeader className="space-y-2 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>Approved Audition Outline</CardTitle>
                    <CardDescription>
                      20 carefully selected questions across 6 performance dimensions
                    </CardDescription>
                  </div>
                  {bankId && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {cacheHit ? '♻️ Cached Bank' : '🆕 New Bank'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {bankId && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Question Bank ID
                        </p>
                        <p className="font-mono text-sm">{bankId}</p>
                      </div>
                      {cacheHit && (
                        <Badge variant="secondary" className="text-xs">
                          Using cached questions
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {Object.keys(questionsByDimension).length > 0 ? (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {Object.entries(questionsByDimension).map(([dimension, questions]) => {
                      const config = dimensionConfig[dimension];
                      const Icon = config?.icon || HelpCircle;
                      const label = config?.label || dimension;
                      const iconColor = config?.color || 'text-muted-foreground';
                      const questionList = questions as any[];
                      
                      return (
                        <AccordionItem key={dimension} value={dimension} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-3">
                              <Icon className={cn("h-5 w-5", iconColor)} />
                              <span className="font-semibold">{label}</span>
                              <Badge variant="secondary" className="ml-2">
                                {questionList.length} question{questionList.length !== 1 ? 's' : ''}
                              </Badge>
                              {dimensionWeights?.[dimension] && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({Math.round(dimensionWeights[dimension] * 100)}% weight)
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-4 pt-2">
                              {questionList.map((question: any, index: number) => (
                                <div
                                  key={question.question_id}
                                  className="border-l-4 border-primary/30 pl-4 py-3 bg-muted/20 rounded-r"
                                >
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium leading-relaxed">
                                      <span className="text-muted-foreground mr-2">Q{index + 1}:</span>
                                      {question.question_text}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {question.archetype_id?.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      The audition questions will appear here once the generation is complete.
                    </p>
                  </div>
                )}
                
                {dimensionWeights && (
                  <div className="space-y-3 rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold">Performance Focus</h3>
                    <div className="space-y-2">
                      {Object.entries(dimensionWeights)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([dimension, weight]) => {
                          const config = dimensionConfig[dimension];
                          const Icon = config?.icon || HelpCircle;
                          const label = config?.label || dimension;
                          const percentage = Math.round((weight as number) * 100);
                          
                          return (
                            <div key={dimension} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">{label}</span>
                                </div>
                                <span className="text-muted-foreground">{percentage}%</span>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                
                {dimensionRationale && (
                  <div className="space-y-2 rounded-lg border border-dashed border-muted bg-muted/40 px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rationale
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {dimensionRationale}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader className="space-y-2 pb-4">
                <CardTitle>Candidate Progress</CardTitle>
                <CardDescription>
                  Monitor how candidates are moving through this Audition.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {renderCandidateStatus()}
              </CardContent>
            </Card>
          </section>
        </div>
      </TooltipProvider>
    </ProjectLayout>
  );
};

export default ProjectDetailPage;
