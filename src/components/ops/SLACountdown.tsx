import { Progress } from '@/components/ui/progress';

interface SLACountdownProps {
  deadline: string;
}

export const SLACountdown = ({ deadline }: SLACountdownProps) => {
  const now = new Date();
  const end = new Date(deadline);
  const hoursLeft = Math.max(0, (end.getTime() - now.getTime()) / (1000 * 60 * 60));
  const percentage = (hoursLeft / 48) * 100;

  const getStatusColor = () => {
    if (hoursLeft < 12) return 'text-[#EF4444]'; // Red
    if (hoursLeft < 24) return 'text-[#F59E0B]'; // Amber
    return 'text-[#22C55E]'; // Green
  };

  return (
    <div className="space-y-1">
      <p className={`text-xs font-medium ${getStatusColor()}`}>
        {Math.ceil(hoursLeft)}h left
      </p>
      <Progress value={percentage} className="h-1" />
    </div>
  );
};
