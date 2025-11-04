import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AuditionScaffoldResponse = {
  status: 'READY' | 'GENERATING' | 'FAILED';
  bank_id: string;
  questions?: Array<{
    question_id: string;
    dimension: string;
    archetype_id: string;
    question_text: string;
    quality_score: number;
  }>;
  role_definition?: any;
  cache_hit?: boolean;
  message?: string;
  elapsed_minutes?: number;
  estimated_remaining_minutes?: number;
  retry_after_seconds?: number;
  error?: string;
};

const parseEdgeResponse = <T,>(payload: unknown, errorMessage: string): T => {
  if (!payload) {
    throw new Error(errorMessage);
  }

  try {
    if (typeof payload === "string") {
      return JSON.parse(payload) as T;
    }

    return payload as T;
  } catch (error) {
    console.error("Failed to parse edge function response", error);
    throw new Error(errorMessage);
  }
};

const GenerateAudition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wizardState } = useProjectWizard();
  const projectId = wizardState.projectId || wizardState.project_id;

  const [messageIndex, setMessageIndex] = useState(0);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const statusMessages = [
    "📊 Analyzing role dimensions...",
    "🎯 Matching questions to your role profile...",
    "🔍 Evaluating question quality scores...",
    "✨ Finalizing your audition outline...",
    "🏗️ Building your question bank...",
    "⚡ Almost there..."
  ];

  useEffect(() => {
    if (!projectId) {
      navigate("/workspace/new/jd-upload");
    }
  }, [projectId, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % statusMessages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [statusMessages.length]);

  const formatTime = (minutes: number) => {
    const totalSeconds = Math.floor(minutes * 60);
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const calculateProgress = (elapsed: number, remaining: number) => {
    const total = elapsed + remaining;
    if (total === 0) return 0;
    return Math.min(Math.round((elapsed / total) * 100), 95);
  };

  const scaffoldQuery = useQuery({
    queryKey: ["audition-scaffold", projectId],
    enabled: !!projectId,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: (query) => {
      // Poll every 10 seconds if status is GENERATING
      const currentData = query.state.data as AuditionScaffoldResponse | undefined;
      return currentData?.status === 'GENERATING' ? 10000 : false;
    },
    queryFn: async (): Promise<AuditionScaffoldResponse> => {
      if (!projectId) {
        throw new Error("Missing project ID");
      }

      const { data: rawResponse, error } = await supabase.functions.invoke(
        "fn_generate_audition_scaffold",
        {
          body: {
            project_id: projectId,
          },
        },
      );

      if (error) {
        console.error("Failed to generate audition scaffold", error);
        throw new Error(error.message || "We couldn't build the audition scaffold. Please try again.");
      }

      return parseEdgeResponse<AuditionScaffoldResponse>(
        rawResponse,
        "We couldn't build the audition scaffold. Please try again.",
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Missing project information. Please return to the previous step.");
      }

      const scaffold = scaffoldQuery.data;

      if (!scaffold || scaffold.status !== 'READY' || !scaffold.questions) {
        throw new Error("No audition scaffold available to approve.");
      }

      // Get role definition ID
      const { data: roleDefData, error: roleDefError } = await supabase
        .from("role_definitions")
        .select("id")
        .eq("project_id", projectId)
        .single();

      if (roleDefError || !roleDefData) {
        throw new Error("Role definition not found");
      }

      // Save scaffold with selected questions
      const { error: scaffoldError } = await supabase
        .from("audition_scaffolds")
        .upsert(
          {
            role_definition_id: roleDefData.id,
            scaffold_data: { 
              questions: scaffold.questions, 
              bank_id: scaffold.bank_id 
            },
            scaffold_preview_html: null,
            definition_snapshot: scaffold.role_definition,
          },
          { onConflict: "role_definition_id" },
        );

      if (scaffoldError) {
        throw new Error(scaffoldError.message || "Could not save the audition scaffold.");
      }

      // Update project status
      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: "activation_in_progress" })
        .eq("id", projectId);

      if (projectError) {
        throw new Error(projectError.message || "Could not update the project status.");
      }
    },
    onSuccess: () => {
      toast({
        title: "Audition approved",
        description: "Your audition outline is locked in. Let's prep for deployment.",
      });
      navigate("/workspace/new/deploy-options");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to approve audition.";
      toast({
        title: "Unable to approve audition",
        description: message,
        variant: "destructive",
      });
    },
  });

  const renderContent = () => {
    if (scaffoldQuery.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating your audition outline...</p>
        </div>
      );
    }

    if (scaffoldQuery.isError) {
      const message =
        scaffoldQuery.error instanceof Error
          ? scaffoldQuery.error.message
          : "We couldn't build the audition scaffold. Please try again.";

      return (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p className="text-base font-medium text-destructive">{message}</p>
          <Button onClick={() => scaffoldQuery.refetch()}>Try Again</Button>
        </div>
      );
    }

    const scaffold = scaffoldQuery.data;

    if (!scaffold) {
      return null;
    }

    // Handle GENERATING state
    if (scaffold.status === 'GENERATING') {
      const elapsedMinutes = scaffold.elapsed_minutes || 0;
      const estimatedRemaining = scaffold.estimated_remaining_minutes || 3;
      const progressPercentage = calculateProgress(elapsedMinutes, estimatedRemaining);
      
      return (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse" />
          
          <CardContent className="relative flex flex-col items-center justify-center gap-6 py-16">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute -top-2 -right-2 h-4 w-4 animate-ping">
                <div className="h-full w-full rounded-full bg-primary/60" />
              </div>
            </div>
            
            <div className="text-center space-y-4 max-w-lg">
              <p className="text-xl font-semibold">
                Generating Your Custom Question Bank
              </p>
              
              <p className="text-sm text-muted-foreground font-medium">
                {statusMessages[messageIndex]}
              </p>
              
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {progressPercentage}% complete
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">⏱️ Elapsed:</span>
                  <span className="font-mono font-semibold">{formatTime(elapsedMinutes)}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-mono font-semibold">~{formatTime(estimatedRemaining)}</span>
                </div>
              </div>
              
              <Collapsible
                open={isDetailsExpanded}
                onOpenChange={setIsDetailsExpanded}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isDetailsExpanded ? "Hide" : "Show"} what's happening behind the scenes
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      isDetailsExpanded && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      🧠 AI is working on:
                    </p>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Generating 50+ custom questions across 6 performance dimensions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Evaluating each question for quality and relevance (1-3 stars)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Selecting the top 20 questions that match your role profile</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Creating a reusable question bank for similar roles</span>
                      </li>
                    </ul>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        💡 <span className="font-medium">First-time generation</span> takes 2-3 minutes. 
                        Similar roles in the future will load <span className="font-medium">instantly</span> from this bank!
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Handle FAILED state
    if (scaffold.status === 'FAILED') {
      return (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p className="text-base font-medium text-destructive">Question Bank Generation Failed</p>
          <p className="text-sm text-muted-foreground">
            {scaffold.error || 'An error occurred while generating your question bank. Please try again.'}
          </p>
          <Button onClick={() => scaffoldQuery.refetch()}>
            Retry Generation
          </Button>
        </div>
      );
    }

    // Handle READY state
    if (!scaffold.questions || scaffold.questions.length === 0) {
      return (
        <div className="p-6 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">No questions available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Selected Questions</CardTitle>
            <div className="text-sm text-muted-foreground">
              {scaffold.questions.length} questions
              {scaffold.cache_hit && ' (cached)'}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scaffold.questions.map((question, index) => (
                <div key={question.question_id} className="border-l-4 border-primary/30 pl-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Q{index + 1}: {question.question_text}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="bg-muted px-2 py-1 rounded text-xs">
                          {question.dimension}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded text-xs">
                          {question.archetype_id}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded text-xs">
                          Quality: {question.quality_score}/3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {scaffold.bank_id && (
          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Bank ID: <span className="font-mono text-xs">{scaffold.bank_id}</span>
              {scaffold.cache_hit && ' • Using cached question bank'}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            {approveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Approve & Continue"
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Step 4 of 5: Review Audition Outline</p>
            <Button variant="outline" onClick={() => navigate("/workspace/new/review-role-dna")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Your Generated Audition Outline</h1>
            <p className="text-base text-muted-foreground">
              Based on the Role DNA you confirmed, here's the Audition we've designed. It focuses on the most critical skills
              and scenarios for this role.
            </p>
          </div>
        </header>

        {renderContent()}
      </div>
    </div>
  );
};

export default GenerateAudition;
