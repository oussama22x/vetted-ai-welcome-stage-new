import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'pending' | 'awaiting_setup_call' | 'awaiting' | 'scoring' | 'ready' | 'pending_activation' | 'activation_in_progress' | 'in_progress' | 'completed';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  switch (status) {
    case 'pending_activation':
    case 'pending':
      return (
        <Badge className="bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]">
          Pending Activation
        </Badge>
      );
    case 'activation_in_progress':
      return (
        <Badge className="bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#DBEAFE]">
          Activation in Progress
        </Badge>
      );
    case 'awaiting_setup_call':
      return (
        <Badge className="bg-[#DDD6FE] text-[#5B21B6] hover:bg-[#DDD6FE]">
          Awaiting Setup Call
        </Badge>
      );
    case 'awaiting':
      return (
        <Badge className="bg-[#D6D1FF] text-[#5A4FCF] hover:bg-[#D6D1FF]">
          Awaiting Vetting
        </Badge>
      );
    case 'scoring':
      return (
        <Badge className="bg-[#FEF3C7] text-[#F59E0B] hover:bg-[#FEF3C7]">
          <span className="flex items-center gap-2">
            Scoring
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          </span>
        </Badge>
      );
    case 'ready':
      return (
        <Badge className="bg-[#D1FAE5] text-[#22C55E] hover:bg-[#D1FAE5]">
          Shortlist Ready
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="capitalize">
          {status.replace(/_/g, ' ')}
        </Badge>
      );
  }
};
