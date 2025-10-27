import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MAX_CHAR_COUNT = 10_000;
const CHAR_LIMIT_MESSAGE =
  "Your job description is over the 10,000-character limit. For best results with our AI Co-pilot, please use a more concise JD focused on the core responsibilities and qualifications.";

const normalizeStringField = (
  payload: Record<string, unknown>,
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
};

export default function JdUpload() {
  const navigate = useNavigate();
  const { saveWizardState, wizardState } = useProjectWizard();
  const { toast } = useToast();
  const [jd, setJd] = useState(wizardState.jdContent || wizardState.jobDescription || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const characterCount = jd.length;
  const isOverCharLimit = characterCount > MAX_CHAR_COUNT;
  const formattedCharacterCount = useMemo(
    () => `${characterCount.toLocaleString()} / ${MAX_CHAR_COUNT.toLocaleString()}`,
    [characterCount]
  );

  const displayedError = isOverCharLimit ? CHAR_LIMIT_MESSAGE : errorMessage;

  const handleJdChange = (value: string) => {
    setJd(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleJdChange(text);
    };
    reader.readAsText(file);
  };

  const handleContinue = async () => {
    if (jd.length < 50) {
      toast({
        title: "Job description too short",
        description: "Please provide a more detailed job description (at least 50 characters).",
        variant: "destructive",
      });
      return;
    }

    if (isOverCharLimit) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Call AI parsing edge function
      const { data, error } = await supabase.functions.invoke("parse-job-description", {
        body: { jd_text: jd },
      });

      if (error) {
        console.error("AI parsing error:", error);
        throw error;
      }

      const parsedPayload =
        typeof data === "string"
          ? (JSON.parse(data) as Record<string, unknown> | null)
          : ((data as Record<string, unknown> | null) ?? null);

      if (!parsedPayload) {
        throw new Error("Empty response from JD parser");
      }

      if (typeof parsedPayload.error === "string" && parsedPayload.error.trim().length > 0) {
        throw new Error(parsedPayload.error);
      }

      const roleTitle = normalizeStringField(parsedPayload, [
        "role_title",
        "roleTitle",
        "job_title",
        "jobTitle",
      ]);
      const jobSummary = normalizeStringField(parsedPayload, [
        "job_summary",
        "jobSummary",
        "summary",
      ]);

      if (!roleTitle || !jobSummary) {
        throw new Error("Invalid response from JD parser");
      }

      const companyName = normalizeStringField(parsedPayload, ["company_name", "companyName"]);
      const keySkillsSource = Array.isArray(parsedPayload.key_skills)
        ? parsedPayload.key_skills
        : Array.isArray(parsedPayload.keySkills)
          ? parsedPayload.keySkills
          : undefined;
      const keySkillsList = keySkillsSource
        ?.map((skill) => (typeof skill === "string" ? skill.trim() : ""))
        .filter((skill) => skill.length > 0);
      const keySkills = keySkillsList && keySkillsList.length > 0 ? keySkillsList : undefined;
      const experienceLevel = normalizeStringField(parsedPayload, [
        "experience_level",
        "experienceLevel",
      ]);
      // Save parsed data to wizard state
      saveWizardState({
        jobDescription: jd,
        jdContent: jd,
        roleTitle,
        jobSummary,
        companyName,
        keySkills,
        experienceLevel,
      });

      navigate("/workspace/new/confirm-role-summary");
    } catch (error) {
      console.error("Failed to parse JD:", error);
      const normalizedError =
        typeof error === "object" && error !== null
          ? (error as {
              status?: number;
              context?: { response?: { status?: number } };
              message?: string;
            })
          : undefined;

      const errorStatus =
        normalizedError?.status ?? normalizedError?.context?.response?.status ??
        (error instanceof Error && "status" in error ? (error as { status?: number }).status : undefined);

      const rawMessage =
        (normalizedError?.message ?? (error instanceof Error ? error.message : "")) || "";
      const lowerCaseMessage = rawMessage.toLowerCase();

      const isPayloadTooLarge =
        errorStatus === 413 ||
        rawMessage.includes("413") ||
        lowerCaseMessage.includes("payload too large");

      const fallbackMessage =
        "We couldn't process that Job Description. Please try again or simplify the text.";
      const friendlyMessage = isPayloadTooLarge ? CHAR_LIMIT_MESSAGE : fallbackMessage;

      setErrorMessage(friendlyMessage);

      toast({
        title: "Processing failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Step 1 of 4</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workspace')}
            >
              ← Back to Workspace
            </Button>
          </div>
          <CardTitle className="text-3xl">Start Your Vetting Project</CardTitle>
          <CardDescription>
            Paste your Job Description below or upload a file to get started.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Textarea
              value={jd}
              onChange={(e) => handleJdChange(e.target.value)}
              placeholder="Paste your job description here...&#10;&#10;Example: We're looking for a Senior Full-Stack Engineer with 5+ years of experience..."
              className="min-h-[300px] text-base resize-none"
            />

            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                Provide enough detail for our AI Co-pilot to understand the role.
              </div>
              <div
                className={cn(
                  "font-medium",
                  isOverCharLimit ? "text-destructive" : "text-muted-foreground"
                )}
                aria-live="polite"
              >
                {formattedCharacterCount}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <label htmlFor="file-upload">
              <Button variant="outline" className="w-full" asChild>
                <div className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File (PDF, DOCX, TXT)
                </div>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={jd.length < 50 || isOverCharLimit || isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Job Description...
                </>
              ) : (
                'Continue →'
              )}
            </Button>
          </div>
          {displayedError && (
            <div className="text-sm text-destructive text-right">{displayedError}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
