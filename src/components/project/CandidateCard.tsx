import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CandidateCardProps {
  fileName: string;
  parsedName?: string;
  status: 'awaiting' | 'scoring' | 'scored';
}

const statusConfig = {
  awaiting: { label: 'Awaiting', className: 'bg-[#D6D1FF] text-[#5A4FCF] hover:bg-[#D6D1FF]' },
  scoring: { label: 'Scoring', className: 'bg-[#FEF3C7] text-[#F59E0B] hover:bg-[#FEF3C7]' },
  scored: { label: 'Scored', className: 'bg-[#D1FAE5] text-[#22C55E] hover:bg-[#D1FAE5]' },
};

export const CandidateCard = ({ fileName, parsedName, status }: CandidateCardProps) => {
  const config = statusConfig[status];

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{parsedName || fileName}</p>
          <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          <div className="mt-2">
            <Badge className={config.className} variant="secondary">
              {config.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
