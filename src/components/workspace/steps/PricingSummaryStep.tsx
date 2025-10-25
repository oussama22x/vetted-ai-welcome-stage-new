import { Button } from "@/components/ui/button";
import { ChatMessage } from "../ChatMessage";
import { ArrowRight } from "lucide-react";
import { TierInfo } from "@/hooks/useChatFlow";

interface PricingSummaryStepProps {
  candidateCount: number;
  tier: TierInfo;
  jobTitle: string;
  candidateSource: 'own' | 'network' | null;
  onComplete: () => void;
}

export const PricingSummaryStep = ({ 
  candidateCount, 
  tier,
  jobTitle,
  candidateSource,
  onComplete 
}: PricingSummaryStepProps) => {
  const candidatePoolText = candidateSource === 'own' 
    ? `${candidateCount} Candidates Uploaded`
    : 'VettedAI Network';
  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content={
          <div className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Pilot Project Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm your vetting project details.
                </p>
              </div>
              
              <div className="space-y-4 text-center py-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Regular Price</p>
                  <p className="text-3xl text-muted-foreground line-through">
                    ${tier.anchorPrice}
                  </p>
                </div>
                
                <div className="py-2">
                  <p className="text-sm font-medium mb-2">Your Pilot Price</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <p className="text-6xl font-bold text-primary">
                      ${tier.pilotPrice}
                    </p>
                    <span className="text-sm text-muted-foreground">(one-time)</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Pilot pricing helps us prioritize your shortlist and deliver 
                  exceptional results.
                </p>
              </div>
              
              <div className="pt-4 border-t border-border space-y-3">
                <p className="font-semibold">What's Included</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium">{jobTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vetting Tier:</span>
                    <span className="font-medium">{tier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Candidate Pool:</span>
                    <span className="font-medium">{candidatePoolText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        delay={0}
      />
      
      <div className="flex justify-center pt-4 animate-fade-in">
        <Button onClick={onComplete} size="lg" className="gap-2">
          Proceed to Payment
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
