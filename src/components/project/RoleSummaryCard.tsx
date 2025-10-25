import { Badge } from "@/components/ui/badge";
import { Upload, Network } from "lucide-react";
import { TierInfo } from "@/hooks/useChatFlow";
import { StatusBadge } from "./StatusBadge";
import { ProgressTimeline } from "./ProgressTimeline";

interface RoleSummaryCardProps {
  roleTitle: string;
  tier: TierInfo;
  candidateSource: 'own' | 'network';
  candidateCount: number;
  status: 'pending' | 'awaiting_setup_call' | 'awaiting' | 'scoring' | 'ready' | 'pending_activation' | 'activation_in_progress' | 'in_progress' | 'completed';
  progress: {
    hoursElapsed: number;
    totalHours: 48;
    percentage: number;
  };
}

export const RoleSummaryCard = ({
  roleTitle,
  tier,
  candidateSource,
  candidateCount,
  status,
  progress,
}: RoleSummaryCardProps) => {
  const SourceIcon = candidateSource === 'own' ? Upload : Network;
  const sourceText = candidateSource === 'own' 
    ? `${candidateCount} Candidates Uploaded`
    : 'VettedAI Network';

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{roleTitle}</h2>
        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
          {tier.name}
        </Badge>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <SourceIcon className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Candidate Source</p>
            <p className="text-sm text-muted-foreground">{sourceText}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Project Status</p>
          <StatusBadge status={status} />
        </div>

        <ProgressTimeline 
          hoursElapsed={progress.hoursElapsed}
          totalHours={progress.totalHours}
          percentage={progress.percentage}
        />

        <div className="text-xs text-muted-foreground">
          <p>Delivery SLA: 48-72 hours to verified shortlist</p>
        </div>
      </div>
    </div>
  );
};
