import { Progress } from "@/components/ui/progress";

interface ProgressTimelineProps {
  hoursElapsed: number;
  totalHours: number;
  percentage: number;
}

export const ProgressTimeline = ({ hoursElapsed, totalHours, percentage }: ProgressTimelineProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{hoursElapsed} / {totalHours} hours elapsed</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
