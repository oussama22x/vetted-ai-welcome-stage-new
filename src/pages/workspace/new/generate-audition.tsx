import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useProjectWizard, type WizardState } from "@/hooks/useProjectWizard";
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

interface FinalRoleDefinition {
  roleDefinition: RoleDefinitionData;
  contextFlags: ContextFlags;
  clarifierResponses: Record<string, string>;
}

interface WizardStateWithFinal extends WizardState {
  finalRoleDefinition?: FinalRoleDefinition;
}

interface AuditionScaffoldResponse {
  scaffold_data?: {
    objective?: string;
    context_frame?: string;
    inputs?: string[];
    constraint_dials?: Record<string, number>;
    chosen_dimensions?: string[];
    dimension_justification?: string;
    mechanics?: string[];
  };
  scaffold_preview_html?: string;
}

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

  const wizardStateWithFinal = wizardState as WizardStateWithFinal;
  const { finalRoleDefinition } = wizardStateWithFinal;
  const projectId = wizardStateWithFinal.project_id ?? wizardStateWithFinal.projectId ?? null;

  useEffect(() => {
    if (!finalRoleDefinition || !projectId) {
      navigate("/workspace/new/confirm-role-summary");
    }
  }, [finalRoleDefinition, projectId, navigate]);

  const scaffoldQuery = useQuery({
    queryKey: ["audition-scaffold", finalRoleDefinition],
    enabled: !!finalRoleDefinition,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async (): Promise<AuditionScaffoldResponse> => {
      if (!finalRoleDefinition) {
        throw new Error("Missing role definition. Please confirm your Role DNA again.");
      }

      const { data: rawResponse, error } = await supabase.functions.invoke(
        "fn_generate_audition_scaffold",
        {
          body: {
            definition_data: finalRoleDefinition.roleDefinition,
            context_flags: finalRoleDefinition.contextFlags,
            clarifier_answers: finalRoleDefinition.clarifierResponses,
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

      if (!finalRoleDefinition) {
        throw new Error("Missing role definition. Please confirm your Role DNA again.");
      }

      const scaffold = scaffoldQuery.data;

      if (!scaffold || !scaffold.scaffold_data || !scaffold.scaffold_preview_html) {
        throw new Error("No audition scaffold available to approve.");
      }

      const { roleDefinition, contextFlags, clarifierResponses } = finalRoleDefinition;
      const definitionPayload = {
        ...roleDefinition,
        context_flags: contextFlags,
        clarifier_responses: clarifierResponses,
      } as Record<string, unknown>;

      const { data: roleDefinitionRecord, error: roleDefinitionError } = await supabase
        .from("role_definitions")
        .upsert(
          {
            project_id: projectId,
            definition_data: definitionPayload,
          },
          { onConflict: "project_id" },
        )
        .select("id")
        .single();

      if (roleDefinitionError) {
        console.error("Failed to save role definition", roleDefinitionError);
        throw new Error(roleDefinitionError.message || "Could not save the role definition.");
      }

      const roleDefinitionId = roleDefinitionRecord?.id;

      if (!roleDefinitionId) {
        throw new Error("The role definition could not be saved.");
      }

      const { error: scaffoldError } = await supabase
        .from("audition_scaffolds")
        .upsert(
          {
            role_definition_id: roleDefinitionId,
            scaffold_data: scaffold.scaffold_data,
            scaffold_preview_html: scaffold.scaffold_preview_html,
            definition_snapshot: definitionPayload,
          },
          { onConflict: "role_definition_id" },
        );

      if (scaffoldError) {
        console.error("Failed to save audition scaffold", scaffoldError);
        throw new Error(scaffoldError.message || "Could not save the audition scaffold.");
      }

      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: "awaiting_deployment" })
        .eq("id", projectId);

      if (projectError) {
        console.error("Failed to update project status", projectError);
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

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Audition Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none text-sm leading-relaxed dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: scaffold.scaffold_preview_html ?? "" }}
            />
          </CardContent>
        </Card>

        {scaffold.scaffold_data?.dimension_justification && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Rationale:</span>{" "}
            {scaffold.scaffold_data.dimension_justification}
          </p>
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
            <p className="text-sm text-muted-foreground">Step 3 of 4: Review Audition Outline</p>
            <Button variant="outline" onClick={() => navigate("/workspace/new/confirm-role-summary")}>
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
