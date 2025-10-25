import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { ArrowLeft, Briefcase, Building, Target, Users, Upload, Network } from "lucide-react";

export default function MagicMoment() {
  const navigate = useNavigate();
  const { wizardState } = useProjectWizard();

  const roleTitle = wizardState.roleTitle?.trim() || "Pending Role Title";
  const companyName = wizardState.companyName?.trim() || "";
  const selectedTier = wizardState.selectedTier;
  const candidateSource = wizardState.candidateSource;
  const candidateCount = wizardState.candidateCount || 0;

  const handleBack = () => {
    navigate('/workspace/new/tier-selection');
  };

  const handleContinue = () => {
    navigate('/workspace/new/book-call');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Step 4 of 4</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workspace')}
            >
              ← Exit Setup
            </Button>
          </div>
          <CardTitle className="text-3xl">
            Your Proof of Work Setup for {roleTitle}
          </CardTitle>
          <p className="text-muted-foreground">
            Review your project details before booking your setup call.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role & Company Info */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Role Title</p>
                <p className="font-semibold text-lg">{roleTitle}</p>
              </div>
            </div>
            
            {companyName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Company</p>
                  <p className="font-semibold text-lg">{companyName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Proof Level */}
          {selectedTier && (
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-lg">Proof of Work Level</h4>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {selectedTier.name}
                </Badge>
                <p className="text-sm text-muted-foreground">{selectedTier.bestFor || selectedTier.description}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">What it is:</span> {selectedTier.whatItIs || selectedTier.description}
                </p>
              </div>
            </div>
          )}

          {/* Candidate Source */}
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-lg">Candidate Source</h4>
            </div>
            <div className="flex items-center gap-3">
              {candidateSource === 'own' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Your Own Candidates</p>
                    <p className="text-sm text-muted-foreground">{candidateCount} candidate{candidateCount !== 1 ? 's' : ''} uploaded</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Network className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">VettedAI Network</p>
                    <p className="text-sm text-muted-foreground">We'll source qualified candidates for you</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4">
            <Button onClick={handleBack} variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleContinue} size="lg" className="sm:w-auto w-full">
              Book Your Setup Call →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
