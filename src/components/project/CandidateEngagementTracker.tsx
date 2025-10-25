import { Progress } from "@/components/ui/progress";

interface CandidateEngagementTrackerProps {
  candidatesCompleted: number;
  totalCandidates: number;
  completionPercentage: number;
}

export const CandidateEngagementTracker = ({
  candidatesCompleted,
  totalCandidates,
  completionPercentage
}: CandidateEngagementTrackerProps) => {
  
  const getMessage = () => {
    if (completionPercentage === 0 || completionPercentage <= 25) {
      return "Tasks have been deployed. We're now awaiting candidate submissions.";
    } else if (completionPercentage <= 70) {
      return "Excellent! Results are coming in. Our system begins analysis as soon as we have enough data for a meaningful comparison.";
    } else {
      return "We have a strong response! Our team is now performing the final analysis to build your high-confidence shortlist.";
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Candidate Engagement</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Proof of Work Completion</span>
            <span className="font-medium">
              {candidatesCompleted} / {totalCandidates} ({completionPercentage}%)
            </span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getMessage()}
        </p>
      </div>
    </div>
  );
};
