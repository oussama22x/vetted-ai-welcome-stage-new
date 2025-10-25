import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit2 } from "lucide-react";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const { wizardState } = useProjectWizard();
  
  // Use router state as fallback if wizardState.selectedTier is undefined
  const selectedTier = wizardState.selectedTier || location.state?.selectedTier;

  const handleContinue = () => {
    // Pass wizard state to checkout
    navigate('/checkout', { state: { wizardState } });
  };

  const handleBack = () => {
    navigate('/workspace/new/tier-selection');
  };

  const handleEdit = (step: string) => {
    navigate(`/workspace/new/${step}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="mb-2 text-sm text-muted-foreground">Step 6 of 6</div>
          <CardTitle className="text-3xl">Review Your Project</CardTitle>
          <CardDescription>
            Double-check all details before proceeding to payment.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Role Details */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg">Role Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit('jd-confirm')}
                className="gap-2"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Role Title:</span>
                <p className="font-medium mt-1">{wizardState.roleTitle}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Job Summary:</span>
                <p className="font-medium mt-1">{wizardState.jobSummary}</p>
              </div>
            </div>
          </div>

          {/* Candidate Source */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg">Candidate Source</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit('candidate-source')}
                className="gap-2"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Source:</span>
                <p className="font-medium mt-1">
                  {wizardState.candidateSource === 'own' 
                    ? 'Upload My Own Candidates' 
                    : 'VettedAI Network'}
                </p>
              </div>
              {wizardState.candidateSource === 'own' && wizardState.candidateCount && (
                <div>
                  <span className="text-muted-foreground">Candidates:</span>
                  <p className="font-medium mt-1">{wizardState.candidateCount} uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-2 border-primary/20 rounded-lg p-6 bg-primary/5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-lg">Pricing Summary</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit('tier-selection')}
                className="gap-2"
              >
                <Edit2 className="w-3 h-3" />
                Edit Tier
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Selected Tier:</span>
                <span className="font-medium">{selectedTier?.name}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Regular Price:</span>
                <span className="line-through text-muted-foreground">
                  ${selectedTier?.anchorPrice}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Pilot Discount:</span>
                <span className="text-green-600 font-medium">
                  -${(selectedTier?.anchorPrice || 0) - (selectedTier?.pilotPrice || 0)}
                </span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Due Today:</span>
                  <span className="text-3xl font-bold text-primary">
                    ${selectedTier?.pilotPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Experience */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg">Candidate Experience</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit('candidate-preview')}
                className="gap-2"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Candidates will receive a personalized email with their Proof of Work task and access to a dedicated landing page.
            </p>
          </div>

          {/* Disclaimer */}
          <Alert>
            <AlertDescription className="text-sm">
              Your final shortlist will be delivered within 48-72 hours, depending on how quickly 
              candidates complete their tasks. You can track their progress live on your dashboard.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button onClick={handleBack} variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex flex-col items-end gap-2">
              <p className="text-xs text-muted-foreground">
                You'll be redirected to secure payment processing
              </p>
              <Button onClick={handleContinue} size="lg" className="gap-2">
                Complete Payment • ${selectedTier?.pilotPrice}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
