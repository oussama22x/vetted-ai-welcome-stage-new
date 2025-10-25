import { Button } from "@/components/ui/button";
import { ChatMessage } from "../ChatMessage";
import { Mail, Layout, ArrowRight } from "lucide-react";

interface CandidatePreviewStepProps {
  onComplete: () => void;
  onAddMessage: (msg: { type: 'user' | 'assistant'; content: string }) => void;
}

export const CandidatePreviewStep = ({ onComplete, onAddMessage }: CandidatePreviewStepProps) => {
  const handleConfirm = () => {
    onAddMessage({
      type: 'user',
      content: "The candidate experience looks good!"
    });
    
    onAddMessage({
      type: 'assistant',
      content: "Perfect! Now let's choose your assessment tier."
    });
    
    onComplete();
  };

  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content="Here's what your candidates will see when we send them their Proof of Work task:"
        delay={0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>Email Preview</span>
          </div>
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">From: VettedAI</div>
              <div className="text-xs text-muted-foreground">Subject: Your Skills Assessment Invitation</div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm leading-relaxed">Hi [Candidate Name],</p>
              <p className="text-sm leading-relaxed">
                You've been invited to complete a skills assessment for the <strong>[Role Title]</strong> position.
              </p>
              <p className="text-sm leading-relaxed">
                This assessment will take approximately 15-30 minutes and is designed to showcase your real-world abilities.
              </p>
              <div className="pt-2">
                <Button variant="secondary" size="sm" disabled>
                  Start Assessment →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Task Landing Page Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Layout className="w-4 h-4" />
            <span>Task Landing Page</span>
          </div>
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">[Role Title] Assessment</h3>
              <p className="text-sm text-muted-foreground">Complete this task to demonstrate your skills</p>
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="bg-muted/30 rounded p-3 text-xs space-y-1">
                <div className="font-medium">Task Overview</div>
                <div className="text-muted-foreground">• Instructions and guidelines</div>
                <div className="text-muted-foreground">• Deliverable requirements</div>
                <div className="text-muted-foreground">• Submission deadline</div>
              </div>
              <div className="bg-muted/30 rounded p-3 text-xs space-y-1">
                <div className="font-medium">What We're Looking For</div>
                <div className="text-muted-foreground">Key competencies being assessed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={handleConfirm} size="lg" className="gap-2">
          Confirm Experience & Next
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};