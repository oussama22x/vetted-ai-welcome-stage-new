import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { supabase } from "@/integrations/supabase/client";

interface RoleDefinitionData {
  goals: string;
  stakeholders: string;
  decision_horizon: string;
  tools: string;
  kpis: string;
  constraints: string;
  cognitive_type: string;
  team_topology: string;
  cultural_tone: string;
}

interface ContextFlags {
  role_family: string;
  seniority: string;
  is_startup_context: boolean;
  is_people_management: boolean;
}

interface RoleDefinitionResponse {
  definition_data: RoleDefinitionData;
  context_flags?: ContextFlags;
  clarifier_questions?: string[];
}

interface ScaffoldResponse {
  scaffold_data: {
    objective: string;
    context_frame: string;
    inputs: string[];
    constraint_dials: {
      time_limit_min: number;
      ai_tokens: number;
      [key: string]: number;
    };
    chosen_dimensions: string[];
    dimension_justification: string;
    mechanics: string[];
  };
  scaffold_preview_html: string;
}

interface InitialAuditionResult {
  project_id: string;
  roleDefinitionData: RoleDefinitionData;
  contextFlags: ContextFlags;
  clarifierQuestionsData: string[];
  scaffoldData: ScaffoldResponse;
}

const DEFAULT_CONTEXT_FLAGS: ContextFlags = {
  role_family: "Other",
  seniority: "Not specified",
  is_startup_context: false,
  is_people_management: false,
};

const ESSENTIAL_FIELDS: Array<{
  key: keyof RoleDefinitionData;
  label: string;
  multiline?: boolean;
}> = [
  { key: "goals", label: "Goals", multiline: true },
  { key: "stakeholders", label: "Stakeholders", multiline: true },
  { key: "decision_horizon", label: "Decision Horizon", multiline: true },
  { key: "tools", label: "Tools", multiline: true },
  { key: "kpis", label: "KPIs", multiline: true },
  { key: "constraints", label: "Constraints", multiline: true },
  { key: "cognitive_type", label: "Cognitive Type" },
  { key: "team_topology", label: "Team Topology" },
  { key: "cultural_tone", label: "Cultural Tone", multiline: true },
];

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
  const { wizardState, saveWizardState } = useProjectWizard();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [roleDefinition, setRoleDefinition] = useState<RoleDefinitionData | null>(null);
  const [contextFlags, setContextFlags] = useState<ContextFlags | null>(null);
  const [clarifierQuestions, setClarifierQuestions] = useState<string[] | null>(null);
  const [clarifierResponses, setClarifierResponses] = useState<Record<string, string>>({});
  const [scaffold, setScaffold] = useState<ScaffoldResponse | null>(null);
  const [isRefineDrawerOpen, setIsRefineDrawerOpen] = useState(false);
  const [editedRoleDefinition, setEditedRoleDefinition] = useState<RoleDefinitionData | null>(null);

  useEffect(() => {
    if (!wizardState.jdContent) {
      navigate("/workspace/new/jd-upload");
    }
  }, [navigate, wizardState.jdContent]);

  const createDraftProject = async (): Promise<string> => {
    const roleTitle = wizardState.roleTitle?.trim() || "Untitled Role";
    const jobSummary = wizardState.jobSummary?.trim() || "";
    const candidateSource = wizardState.candidateSource || "own";
    const tierName = wizardState.selectedTier?.name || "Magic";
    const tierId = wizardState.selectedTier?.id ?? 0;
    const candidateCount = wizardState.candidateCount ?? 0;

    const { data: projectIdResponse, error: projectError } = await supabase
      .rpc("create_project_for_current_user", {
        p_role_title: roleTitle,
        p_job_summary: jobSummary,
        p_candidate_source: candidateSource,
        p_tier_name: tierName,
        p_tier_id: tierId,
        p_candidate_count: candidateCount,
      });

    if (projectError) {
      console.error("Failed to create draft project", projectError);
      throw new Error(projectError.message || "Failed to create the draft project");
    }

    const newProjectId = typeof projectIdResponse === "string"
      ? projectIdResponse
      : Array.isArray(projectIdResponse) && projectIdResponse.length > 0
        ? String(projectIdResponse[0])
        : null;

    if (!newProjectId) {
      throw new Error("The draft project could not be created");
    }

    if (wizardState.jdContent) {
      const { error: updateError } = await supabase
        .from("projects")
        .update({ job_description: wizardState.jdContent, status: "draft" })
        .eq("id", newProjectId);

      if (updateError) {
        console.warn("Failed to update draft project with JD", updateError);
      }
    }

    return newProjectId;
  };

  const generateInitialAudition = async (): Promise<InitialAuditionResult> => {
    if (!wizardState.jdContent) {
      throw new Error("Job description missing. Please return to the previous step.");
    }

    const draftProjectId = projectId ?? (await createDraftProject());

    const { data: definitionRaw, error: definitionError } = await supabase.functions.invoke(
      "fn_generate_role_definition",
      {
        body: { jd_text: wizardState.jdContent },
      }
    );

    if (definitionError) {
      console.error("Role definition generation failed", definitionError);
      throw new Error(definitionError.message || "Failed to generate the role definition");
    }

    const definitionResponse = parseEdgeResponse<RoleDefinitionResponse>(
      definitionRaw,
      "We couldn't understand that job description. Please try again."
    );

    const definitionData = definitionResponse.definition_data;
    if (!definitionData) {
      throw new Error("The AI response was missing role definition data");
    }

    const context = definitionResponse.context_flags || DEFAULT_CONTEXT_FLAGS;
    const clarifiers = Array.isArray(definitionResponse.clarifier_questions)
      ? definitionResponse.clarifier_questions
      : [];

    const { data: scaffoldRaw, error: scaffoldError } = await supabase.functions.invoke(
      "fn_generate_audition_scaffold",
      {
        body: {
          definition_data: definitionData,
          context_flags: context,
          clarifier_answers: {},
        },
      }
    );

    if (scaffoldError) {
      console.error("Scaffold generation failed", scaffoldError);
      throw new Error(scaffoldError.message || "Failed to generate the audition scaffold");
    }

    const scaffoldResponse = parseEdgeResponse<ScaffoldResponse>(
      scaffoldRaw,
      "We couldn't build the audition scaffold. Please try again."
    );

    return {
      project_id: draftProjectId,
      roleDefinitionData: definitionData,
      contextFlags: context,
      clarifierQuestionsData: clarifiers,
      scaffoldData: scaffoldResponse,
    };
  };

  const query = useQuery({
    queryKey: ["generateInitialAudition", wizardState.jdContent],
    enabled: !!wizardState.jdContent,
    queryFn: generateInitialAudition,
    refetchOnWindowFocus: false,
    retry: 1,
    onSuccess: (data) => {
      setIsLoading(false);
      setError(null);
      setProjectId(data.project_id);
      saveWizardState({ project_id: data.project_id, projectId: data.project_id });
      setRoleDefinition(data.roleDefinitionData);
      setContextFlags(data.contextFlags);
      setClarifierQuestions(data.clarifierQuestionsData);
      setClarifierResponses({});
      setScaffold(data.scaffoldData);
    },
    onError: (err) => {
      console.error("Initial audition generation failed", err);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Failed to build your audition.");
    },
  });

  useEffect(() => {
    if (query.isLoading || query.isFetching) {
      setIsLoading(true);
    }
  }, [query.isLoading, query.isFetching]);

  useEffect(() => {
    if (isRefineDrawerOpen && roleDefinition) {
      setEditedRoleDefinition(roleDefinition);
    }
  }, [isRefineDrawerOpen, roleDefinition]);

  useEffect(() => {
    if (isRefineDrawerOpen && clarifierQuestions) {
      setClarifierResponses((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        clarifierQuestions.forEach((question) => {
          if (next[question] === undefined) {
            next[question] = "";
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [isRefineDrawerOpen, clarifierQuestions]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !roleDefinition || !scaffold) {
        throw new Error("Missing audition data. Please regenerate and try again.");
      }

      const { data: roleDefinitionRecord, error: roleDefinitionError } = await supabase
        .from("role_definitions")
        .insert({
          project_id: projectId,
          definition_data: roleDefinition,
        })
        .select("id")
        .single();

      if (roleDefinitionError) {
        console.error("Failed to save role definition", roleDefinitionError);
        throw new Error(roleDefinitionError.message || "Could not save the role definition");
      }

      const roleDefinitionId = roleDefinitionRecord?.id;
      if (!roleDefinitionId) {
        throw new Error("Role definition save did not return an ID");
      }

      const { error: scaffoldInsertError } = await supabase.from("audition_scaffolds").insert({
        role_definition_id: roleDefinitionId,
        scaffold_data: scaffold.scaffold_data,
        scaffold_preview_html: scaffold.scaffold_preview_html,
        definition_snapshot: roleDefinition,
      });

      if (scaffoldInsertError) {
        console.error("Failed to save audition scaffold", scaffoldInsertError);
        throw new Error(scaffoldInsertError.message || "Could not save the audition scaffold");
      }

      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({ status: "awaiting_deployment" })
        .eq("id", projectId);

      if (projectUpdateError) {
        console.error("Failed to update project status", projectUpdateError);
        throw new Error(projectUpdateError.message || "Could not update the project status");
      }
    },
    onSuccess: () => {
      toast({
        title: "Audition approved",
        description: "Your audition has been saved.",
      });
      navigate("/workspace/new/deploy-options");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to approve audition.";
      setError(message);
      toast({
        title: "Unable to approve audition",
        description: message,
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (updatedDefinition: RoleDefinitionData) => {
      const payloadDefinition = updatedDefinition;
      const flags = contextFlags || DEFAULT_CONTEXT_FLAGS;

      const { data: regeneratedScaffoldRaw, error: regenerateError } = await supabase
        .functions.invoke("fn_generate_audition_scaffold", {
          body: {
            definition_data: payloadDefinition,
            context_flags: flags,
            clarifier_answers: clarifierResponses,
          },
        });

      if (regenerateError) {
        console.error("Failed to regenerate audition", regenerateError);
        throw new Error(regenerateError.message || "Could not regenerate the audition");
      }

      return parseEdgeResponse<ScaffoldResponse>(
        regeneratedScaffoldRaw,
        "The regenerated audition was invalid. Please try again."
      );
    },
    onSuccess: (newScaffold) => {
      if (editedRoleDefinition) {
        setRoleDefinition(editedRoleDefinition);
      }
      setScaffold(newScaffold);
      setIsRefineDrawerOpen(false);
      toast({
        title: "Audition regenerated",
        description: "The preview has been updated.",
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to regenerate audition.";
      toast({
        title: "Unable to regenerate",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    query.refetch();
  };

  const displayedClarifierQuestions = useMemo(
    () => clarifierQuestions?.filter((question) => question && question.trim().length > 0) ?? [],
    [clarifierQuestions]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Building your Audition...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      );
    }

    if (!scaffold) {
      return null;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Candidate Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: scaffold.scaffold_preview_html }}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            {approveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Approve Audition"
            )}
          </Button>
          <Button
            variant="link"
            onClick={() => setIsRefineDrawerOpen(true)}
            disabled={!roleDefinition}
          >
            Refine Role Assumptions
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <h1 className="text-3xl font-semibold">Generate Audition</h1>
        {renderContent()}
      </div>

      <Drawer open={isRefineDrawerOpen} onOpenChange={setIsRefineDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="space-y-1 text-left">
            <DrawerTitle>Refine Role Assumptions</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Update the essentials or answer clarifier questions to fine-tune the audition scaffold.
            </p>
          </DrawerHeader>

          <div className="max-h-[60vh] overflow-y-auto px-4">
            <div className="space-y-4 py-2">
              {ESSENTIAL_FIELDS.map(({ key, label, multiline }) => {
                const value = editedRoleDefinition?.[key] ?? "";
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    {multiline ? (
                      <Textarea
                        id={key}
                        value={value}
                        onChange={(event) =>
                          setEditedRoleDefinition((prev) => ({
                            ...(prev ?? (roleDefinition as RoleDefinitionData)),
                            [key]: event.target.value,
                          }))
                        }
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={key}
                        value={value}
                        onChange={(event) =>
                          setEditedRoleDefinition((prev) => ({
                            ...(prev ?? (roleDefinition as RoleDefinitionData)),
                            [key]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}

              {displayedClarifierQuestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Clarifier Questions</h3>
                  {displayedClarifierQuestions.map((question, index) => (
                    <div key={`${index}-${question}`} className="space-y-2">
                      <Label htmlFor={`clarifier-${index}`}>{question}</Label>
                      <Textarea
                        id={`clarifier-${index}`}
                        value={clarifierResponses[question] ?? ""}
                        onChange={(event) =>
                          setClarifierResponses((prev) => ({
                            ...prev,
                            [question]: event.target.value,
                          }))
                        }
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DrawerFooter>
            <Button
              onClick={() =>
                editedRoleDefinition && regenerateMutation.mutate(editedRoleDefinition)
              }
              disabled={!editedRoleDefinition || regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate Audition"
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default GenerateAudition;
