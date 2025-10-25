import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Network } from "lucide-react";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUploadZone } from "@/components/workspace/FileUploadZone";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CandidateSource() {
  const navigate = useNavigate();
  const { saveWizardState, wizardState } = useProjectWizard();
  const { toast } = useToast();
  const uploadProps = useFileUpload();
  
  const [source, setSource] = useState<'own' | 'network' | null>(
    wizardState.candidateSource || null
  );

  const handleContinue = () => {
    if (!source) {
      toast({
        title: "Selection required",
        description: "Please select a candidate source to continue.",
        variant: "destructive",
      });
      return;
    }

    if (source === 'own' && uploadProps.files.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload candidate files to continue.",
        variant: "destructive",
      });
      return;
    }

    if (source === 'own' && uploadProps.files.length > 50) {
      toast({
        title: "Too many files",
        description: "Maximum 50 candidates allowed for pilot project.",
        variant: "destructive",
      });
      return;
    }

    saveWizardState({
      candidateSource: source,
      uploadedResumes: source === 'own' ? uploadProps.files : undefined,
      candidateCount: source === 'own' ? uploadProps.files.length : 0,
    });
    
    navigate('/workspace/new/tier-selection');
  };

  const handleBack = () => {
    navigate('/workspace/new/jd-upload');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="mb-2 text-sm text-muted-foreground">Step 2 of 4</div>
          <CardTitle className="text-3xl">Where should we source your candidates from?</CardTitle>
          <CardDescription>
            Let us know if you're bringing your own pipeline or want the VettedAI Network to supply talent for this project.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Upload My Own Candidates */}
            <button
              onClick={() => setSource('own')}
              className={cn(
                "p-6 rounded-lg border-2 transition-all text-left",
                source === 'own'
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">I have my own candidates</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll deliver the Proof of Work experience to the people already in your funnel.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Up to 50 candidates for this pilot project
                  </p>
                </div>
              </div>
            </button>

            {/* Use VettedAI Network */}
            <button
              onClick={() => setSource('network')}
              className={cn(
                "p-6 rounded-lg border-2 transition-all text-left",
                source === 'network'
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Source from the VettedAI Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Tap into our curated pool of talent tailored to your Job Description.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sourcing included at no extra cost
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Show upload zone if "own" is selected */}
          {source === 'own' && (
            <div className="space-y-4 animate-fade-in">
              <FileUploadZone
                files={uploadProps.files}
                isDragging={uploadProps.isDragging}
                onDragEnter={uploadProps.handleDragEnter}
                onDragLeave={uploadProps.handleDragLeave}
                onDragOver={uploadProps.handleDragOver}
                onDrop={uploadProps.handleDrop}
                onFilesSelected={uploadProps.handleFiles}
                onRemoveFile={uploadProps.removeFile}
              />
              {uploadProps.files.length > 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProps.files.length} / 50 candidates uploaded
                </p>
              )}
            </div>
          )}

          {/* Show info box if "network" is selected */}
          {source === 'network' && (
            <div className="p-4 rounded-lg bg-muted border border-border animate-fade-in">
              <h4 className="font-semibold mb-2">What happens next</h4>
              <p className="text-sm text-muted-foreground">
                We'll align the Proof of Work to the role you shared and queue up outreach to matched candidates within 48-72 hours.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!source || (source === 'own' && uploadProps.files.length === 0)}
              size="lg"
            >
              Continue to Proof Level →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
