import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { supabase } from "@/integrations/supabase/client";

const DeployOptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wizardState, clearWizardState } = useProjectWizard();
  const projectId = wizardState.project_id ?? wizardState.projectId;

  const handleError = (error: unknown, actionLabel: string) => {
    const description =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";

    toast({
      title: `Unable to ${actionLabel}`,
      description,
      variant: "destructive",
    });
  };

  const updateProjectStatusSaaS = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Project context is missing.");
      }

      const { error } = await supabase
        .from("projects")
        .update({ status: "awaiting" })
        .eq("id", projectId);

      if (error) {
        throw new Error(error.message || "Failed to update the project status.");
      }
    },
    onSuccess: () => {
      clearWizardState();
      navigate("/workspace");
    },
    onError: (error) => handleError(error, "deploy to your candidates"),
  });

  const updateProjectStatusService = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Project context is missing.");
      }

      const { error } = await supabase
        .from("projects")
        .update({ status: "awaiting_network_match" })
        .eq("id", projectId);

      if (error) {
        throw new Error(error.message || "Failed to update the project status.");
      }
    },
    onSuccess: () => {
      clearWizardState();
      navigate("/workspace/new/network-confirmed");
    },
    onError: (error) => handleError(error, "request VettedAI's network"),
  });

  const isLoading = updateProjectStatusSaaS.isPending || updateProjectStatusService.isPending;
  const isDisabled = !projectId || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Deploy Your Audition</CardTitle>
          <CardDescription>
            Your Audition is approved. How do you want to find your candidates?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => updateProjectStatusSaaS.mutate()}
            disabled={isDisabled}
          >
            Deploy to My Own Candidates
          </Button>
          <Button
            className="flex-1"
            onClick={() => updateProjectStatusService.mutate()}
            disabled={isDisabled}
          >
            Find Candidates from VettedAI's Network
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeployOptions;
