import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  });

  const handleSaaSSelection = async () => {
    try {
      await updateProjectStatusSaaS.mutateAsync();
      clearWizardState();
      navigate("/workspace");
    } catch (error) {
      handleError(error, "deploy to your candidates");
    }
  };

  const handleServiceSelection = async () => {
    try {
      await updateProjectStatusService.mutateAsync();
      clearWizardState();
      navigate("/workspace/new/network-confirmed");
    } catch (error) {
      handleError(error, "request VettedAI's network");
    }
  };

  const isLoading = updateProjectStatusSaaS.isPending || updateProjectStatusService.isPending;
  const isDisabled = !projectId || isLoading;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Step 5 of 5: Choose Candidate Source</p>
            <Button
              variant="outline"
              onClick={() => navigate("/workspace/new/generate-audition")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>How Will You Find Your Candidates?</CardTitle>
            <CardDescription>
              Your Audition is approved. How do you want to find your candidates?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="h-full">
                  <CardHeader className="space-y-3">
                    <CardTitle>Deploy to My Own Candidates</CardTitle>
                    <CardDescription>
                      Invite candidates from your current pipeline or ATS to complete the audition through VettedAI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Info className="h-4 w-4" />
                            What's included
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          Upload or invite your own candidates instantly and track audition progress from your workspace.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Button onClick={handleSaaSSelection} disabled={isDisabled} size="lg" className="transition-all duration-200 hover:scale-105">
                      Select &amp; Go to Workspace
                    </Button>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader className="space-y-3">
                    <CardTitle>Request VettedAI Sourcing</CardTitle>
                    <CardDescription>
                      Partner with our recruiting team to source and engage aligned candidates from the VettedAI network.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Info className="h-4 w-4" />
                            What's included
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          We'll confirm your role essentials, queue outreach to matched talent, and keep you posted in under 72 hours.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Button onClick={handleServiceSelection} disabled={isDisabled} size="lg" className="transition-all duration-200 hover:scale-105">
                      Request VettedAI Sourcing
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeployOptions;
