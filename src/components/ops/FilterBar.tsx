import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  tierId: string;
  onTierChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onClearFilters: () => void;
}

export const FilterBar = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  tierId,
  onTierChange,
  sortBy,
  onSortByChange,
  onClearFilters
}: FilterBarProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by recruiter or role..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="awaiting">Awaiting Vetting</SelectItem>
            <SelectItem value="scoring">Scoring</SelectItem>
            <SelectItem value="ready">Shortlist Ready</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tierId} onValueChange={onTierChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="1">Quick Fit Screen</SelectItem>
            <SelectItem value="2">Scenario Fit</SelectItem>
            <SelectItem value="3">Role Simulation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="sla_deadline">SLA Remaining</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
};
