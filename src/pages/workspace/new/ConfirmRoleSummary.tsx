import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProjectWizard } from "@/hooks/useProjectWizard";

const ConfirmRoleSummary = () => {
  const navigate = useNavigate();
  const { wizardState, saveWizardState } = useProjectWizard();
  const { toast } = useToast();

  // Simple local state for editable fields
  const [roleTitle, setRoleTitle] = useState(wizardState.roleTitle || "");
  const [companyName, setCompanyName] = useState(wizardState.companyName || "");
  const [jobSummary, setJobSummary] = useState(wizardState.jobSummary || "");

  // Redirect if no JD content
  useEffect(() => {
    if (!wizardState.jdContent) {
      navigate("/workspace/new/jd-upload");
    }
  }, [wizardState.jdContent, navigate]);

  // Simplified mutation: ONLY create project with parsed JD data
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const jdContent = wizardState.jdContent;

      if (!jdContent) {
        throw new Error("Job description missing. Please return to the previous step.");
      }

      // Create project using the database function
      const { data: projectId, error: createError } = await supabase.rpc(
        "create_draft_project_v3",
        {
          p_job_description: jdContent,
          p_role_title: roleTitle || "Draft Role",
          p_company_name: companyName || null,
        }
      );

      if (createError) {
        console.error("Failed to create project", createError);
        throw new Error(
          createError.message || "We couldn't create your project. Please try again."
        );
      }

      const project_id =
        typeof projectId === "string" && projectId.trim().length > 0 ? projectId : null;

      if (!project_id) {
        throw new Error("We couldn't create your project. Please try again.");
      }

      return { project_id };
    },
    onSuccess: ({ project_id }) => {
      // Save project_id to wizard state
      saveWizardState({ project_id });

      toast({
        title: "Project created",
        description: "Analyzing role DNA...",
      });

      // Navigate to role DNA review
      navigate("/workspace/new/review-role-dna");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create project.";
      toast({
        title: "Failed to create project",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (!roleTitle.trim() || !jobSummary.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a role title and job summary.",
        variant: "destructive",
      });
      return;
    }

    confirmMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/workspace/new/jd-upload")}
            disabled={confirmMutation.isPending}
          >
            ← Back
          </Button>
          <span className="text-sm text-muted-foreground">Step 2 of 5: Confirm Role Details</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Confirm Role Details</h1>
          <p className="text-base text-muted-foreground">
            Review the information extracted from your job description. You can make edits before continuing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>
              We've extracted key details from your job description. Please review and edit as needed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roleTitle">Role Title *</Label>
              <Input
                id="roleTitle"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Product Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobSummary">Job Summary *</Label>
              <Textarea
                id="jobSummary"
                value={jobSummary}
                onChange={(e) => setJobSummary(e.target.value)}
                placeholder="Brief description of the role and responsibilities"
                rows={5}
              />
            </div>

            {wizardState.keySkills && wizardState.keySkills.length > 0 && (
              <div className="space-y-2">
                <Label>Key Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {wizardState.keySkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {wizardState.experienceLevel && (
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <p className="text-sm text-muted-foreground">
                  {wizardState.experienceLevel}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleConfirm}
                disabled={!roleTitle.trim() || !jobSummary.trim() || confirmMutation.isPending}
                size="lg"
                className="transition-all duration-200 hover:scale-105"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  "Looks Good, Continue →"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmRoleSummary;
