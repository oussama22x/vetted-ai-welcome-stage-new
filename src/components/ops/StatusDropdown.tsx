import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProjectStatus } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';

interface StatusDropdownProps {
  projectId: string;
  currentStatus: string;
}

const statusConfig = {
  awaiting: { label: 'Awaiting Vetting', className: 'bg-[#D6D1FF] text-[#5A4FCF] hover:bg-[#D6D1FF]' },
  scoring: { label: 'Scoring', className: 'bg-[#FEF3C7] text-[#F59E0B] hover:bg-[#FEF3C7]' },
  ready: { label: 'Shortlist Ready', className: 'bg-[#D1FAE5] text-[#22C55E] hover:bg-[#D1FAE5]' },
  pending_activation: { label: 'Pending Activation', className: 'bg-muted text-muted-foreground hover:bg-muted' },
  activation_in_progress: { label: 'Activation In Progress', className: 'bg-[#DBEAFE] text-[#3B82F6] hover:bg-[#DBEAFE]' },
  in_progress: { label: 'In Progress', className: 'bg-[#DBEAFE] text-[#3B82F6] hover:bg-[#DBEAFE]' },
};

export const StatusDropdown = ({ projectId, currentStatus }: StatusDropdownProps) => {
  const updateStatus = useUpdateProjectStatus();

  const canTransitionTo = (newStatus: string) => {
    const transitions: Record<string, string[]> = {
      awaiting: ['scoring'],
      scoring: ['ready'],
      ready: []
    };
    return transitions[currentStatus]?.includes(newStatus) || false;
  };

  const handleStatusChange = (newStatus: string) => {
    if (canTransitionTo(newStatus)) {
      updateStatus.mutate({ projectId, status: newStatus });
    }
  };

  const config = statusConfig[currentStatus as keyof typeof statusConfig] || {
    label: currentStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    className: 'bg-muted text-muted-foreground hover:bg-muted'
  };

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px] border-0 bg-transparent">
        <Badge className={config.className}>
          {config.label}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {currentStatus === 'awaiting' && (
          <SelectItem value="scoring">Move to Scoring</SelectItem>
        )}
        {currentStatus === 'scoring' && (
          <SelectItem value="ready">Mark as Ready</SelectItem>
        )}
        {currentStatus === 'ready' && (
          <SelectItem value="ready" disabled>Already Ready</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
