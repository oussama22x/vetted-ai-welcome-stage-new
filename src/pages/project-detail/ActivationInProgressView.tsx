import { ArrowLeft, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectDetail } from "./types";

type ActivationInProgressViewProps = {
  project: ProjectDetail;
  onBack: () => void;
};

const ActivationInProgressView = ({ project, onBack }: ActivationInProgressViewProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <Button
          variant="ghost"
          className="px-0 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to workspace
        </Button>

        <Card className="border border-border shadow-sm">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit border-blue-200 bg-blue-100 text-blue-700">
              Activation in Progress
            </Badge>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Project Detail</p>
              <CardTitle className="text-3xl text-foreground">{project.role_title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Your setup call is confirmed. We're excited to speak with you.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Keep an eye on your inbox—we'll share calendar details and any prep materials there.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Why We Start with a Conversation.</h3>
              <p className="text-muted-foreground leading-relaxed">
                At VettedAI, "Proof of Work" isn't a generic test. It's a precise simulation of the role, designed to reveal a
                candidate's true ability. Your setup call lets us tune the task so it captures the exact signals you care about.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">What happens next</h3>
              <ol className="relative space-y-6 border-l border-border pl-6">
                <li className="ml-4">
                  <span className="absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-green-700">Step 1 · Setup Call</p>
                    <p className="text-sm text-muted-foreground">✓ Completed</p>
                  </div>
                </li>
                <li className="ml-4">
                  <span className="absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-700">Step 2 · Task Deployment &amp; Vetting</p>
                    <p className="text-sm text-muted-foreground">In progress now</p>
                  </div>
                </li>
                <li className="ml-4">
                  <span className="absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Step 3 · Shortlist Delivered</p>
                    <p className="text-sm text-muted-foreground">
                      We'll send your curated shortlist once vetting is complete.
                    </p>
                  </div>
                </li>
              </ol>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivationInProgressView;
