import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps = 5 }: ProgressIndicatorProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border">
      <div className="max-w-[960px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    </div>
  );
};
