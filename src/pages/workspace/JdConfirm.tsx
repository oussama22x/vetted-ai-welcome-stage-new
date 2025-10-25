import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function JdConfirm() {
  const navigate = useNavigate();
  const { wizardState } = useProjectWizard();

  const jdContent = wizardState.jdContent || wizardState.jobDescription || "";

  useEffect(() => {
    if (!jdContent) {
      navigate('/workspace/new/jd-upload');
    }
  }, [jdContent, navigate]);

  const handleContinue = () => {
    navigate('/workspace/new/candidate-source');
  };

  const handleBack = () => {
    navigate('/workspace/new/jd-upload');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-3">
          <div className="text-sm text-muted-foreground">Step 2 of 5</div>
          <CardTitle className="text-3xl">Confirm Your Job Description</CardTitle>
          <p className="text-muted-foreground">
            Please confirm this is the correct Job Description for the Proof of Work.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* AI Extracted Information Preview */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground">AI Extracted Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Role Title</p>
                <p className="font-semibold text-base">{wizardState.roleTitle?.trim() || 'Not extracted'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Company</p>
                <p className="font-semibold text-base">{wizardState.companyName || 'Not specified'}</p>
              </div>
              {wizardState.experienceLevel && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Experience Level</p>
                  <p className="font-medium text-sm">{wizardState.experienceLevel}</p>
                </div>
              )}
              {wizardState.keySkills && wizardState.keySkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Key Skills</p>
                  <p className="font-medium text-sm">{wizardState.keySkills.slice(0, 3).join(', ')}{wizardState.keySkills.length > 3 && ', ...'}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Summary</p>
                <p className="text-sm leading-relaxed">{wizardState.jobSummary || 'No summary available'}</p>
              </div>
            </div>
          </div>

          {/* Full JD Display */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Full Job Description</h4>
            <ScrollArea className="h-[280px] rounded-lg border bg-muted/30 p-6">
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {jdContent || 'No job description provided.'}
              </pre>
            </ScrollArea>
          </div>

          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Edit
            </Button>
            <Button onClick={handleContinue} size="lg">
              Confirm & Next →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
