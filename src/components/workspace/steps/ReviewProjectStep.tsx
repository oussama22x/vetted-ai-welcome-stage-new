import { Button } from "@/components/ui/button";
import { ChatMessage } from "../ChatMessage";
import { TierInfo } from "@/hooks/useChatFlow";
import { Edit, ArrowRight } from "lucide-react";

interface ReviewProjectStepProps {
  roleTitle: string;
  jobSummary: string;
  candidateSource: 'own' | 'network';
  candidateCount: number;
  tier: TierInfo;
  onComplete: () => void;
  onEdit: (step: number) => void;
}

export const ReviewProjectStep = ({ 
  roleTitle, 
  jobSummary, 
  candidateSource,
  candidateCount,
  tier,
  onComplete,
  onEdit
}: ReviewProjectStepProps) => {
  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content="Perfect! Here's a summary of your vetting project. Review everything before we proceed to payment."
        delay={0}
      />

      <div className="space-y-4">
        {/* Role Details */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-muted-foreground">Role Details</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="gap-1 h-8 -mt-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Position</div>
              <div className="font-medium">{roleTitle}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Summary</div>
              <div className="text-sm leading-relaxed">{jobSummary}</div>
            </div>
          </div>
        </div>

        {/* Candidate Source */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-muted-foreground">Candidate Source</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="gap-1 h-8 -mt-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="space-y-1">
            <div className="font-medium">
              {candidateSource === 'own' ? 'Your Own Candidates' : 'VettedAI Network'}
            </div>
            {candidateSource === 'own' && (
              <div className="text-sm text-muted-foreground">
                {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'} uploaded
              </div>
            )}
            {candidateSource === 'network' && (
              <div className="text-sm text-muted-foreground">
                Sourcing included at no extra cost
              </div>
            )}
          </div>
        </div>

        {/* Vetting Tier */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-muted-foreground">Vetting Tier</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(5)}
              className="gap-1 h-8 -mt-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Tier {tier.id}: {tier.name}</div>
            <div className="text-sm text-muted-foreground">{tier.description}</div>
            <div className="pt-2 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">${tier.pilotPrice}</span>
                <span className="text-sm text-muted-foreground">Pilot Price</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Experience */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-muted-foreground">Candidate Experience</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(4)}
              className="gap-1 h-8 -mt-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Email invitation and task landing page previewed and confirmed
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/30 border border-muted rounded-lg p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your final shortlist will be delivered within 48-72 hours, depending on how quickly 
          candidates complete their tasks. You can track their progress live on your dashboard.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onComplete} size="lg" className="gap-2">
          Continue to Payment
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};