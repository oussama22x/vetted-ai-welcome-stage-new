import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
}

export const NavigationControls = ({
  canGoBack,
  canGoForward,
  onBack,
  onNext,
  currentStep,
  totalSteps,
}: NavigationControlsProps) => {
  return (
    <div className="sticky bottom-0 border-t border-border bg-white/95 backdrop-blur-sm">
      <div className="max-w-[960px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={!canGoBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
          
          <Button
            onClick={onNext}
            disabled={!canGoForward}
            className="gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
