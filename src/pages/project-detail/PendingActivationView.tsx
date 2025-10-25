import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/project/StatusBadge";
import type { ProjectDetail } from "./types";

const STRATEGY_CALL_URL = "https://calendly.com/lemuelabishua";
const SHORTLIST_URL = "https://cal.mixmax.com/ventureforafrica/antler_30";

const candidateSourceCopy: Record<string, string> = {
  own: "You will upload candidates",
  network: "VettedAI Talent Network",
};

const formatCandidateSource = (source?: string | null) => {
  if (!source) return "Not specified";
  return candidateSourceCopy[source] || source;
};

const formatProofLevel = (tierName?: string | null) => tierName || "Proof level not selected";

type PendingActivationViewProps = {
  project: ProjectDetail;
  onBack: () => void;
  onConfirmActivation: () => Promise<void>;
  isConfirming: boolean;
};

const PendingActivationView = ({ project, onBack, onConfirmActivation, isConfirming }: PendingActivationViewProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <Button
          variant="ghost"
          className="px-0 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to workspace
        </Button>

        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Project Detail</p>
            <h1 className="text-3xl font-bold text-foreground">{project.role_title}</h1>
          </div>
          <StatusBadge status="pending_activation" />
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle>Your Project Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review the selections you made in the project wizard. These guide our team before the activation call.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Summary</h3>
                <p className="text-base leading-relaxed text-foreground">
                  {project.job_summary?.trim() || "You haven't provided a job summary yet."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Candidate Source</h3>
                <p className="text-base text-foreground">{formatCandidateSource(project.candidate_source)}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Proof Level</h3>
                <p className="text-base text-foreground">{formatProofLevel(project.tier_name)}</p>
              </div>

              {typeof project.candidate_count === "number" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Candidate Count</h3>
                  <p className="text-base text-foreground">{project.candidate_count}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-muted/30 shadow-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <Button asChild className="w-full justify-center" variant="default">
                  <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener noreferrer">
                    Strategy Call with a Product Expert
                  </a>
                </Button>
                <Button asChild className="w-full justify-center" variant="outline">
                  <a href={SHORTLIST_URL} target="_blank" rel="noopener noreferrer">
                    Deploy Your First VettedAI Shortlist
                  </a>
                </Button>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                Confirm once you've booked your call so we can start preparing your activation.
              </div>

              <Button className="w-full" onClick={onConfirmActivation} disabled={isConfirming}>
                {isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating status...
                  </span>
                ) : (
                  "I've Scheduled My Call"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PendingActivationView;
