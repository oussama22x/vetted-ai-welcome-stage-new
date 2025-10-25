import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CandidateListItem {
  id: string;
  parsed_name: string;
  parsed_email: string;
  status: string;
}

interface CandidateListTableProps {
  candidates: CandidateListItem[];
}

export const CandidateListTable = ({ candidates }: CandidateListTableProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'awaiting': { label: 'Pending', variant: 'secondary' },
      'scoring': { label: 'In Progress', variant: 'default' },
      'scored': { label: 'Completed', variant: 'default' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No candidates uploaded yet.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Task Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium">
                {candidate.parsed_name || 'Name not parsed'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {candidate.parsed_email || 'N/A'}
              </TableCell>
              <TableCell>{getStatusBadge(candidate.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
