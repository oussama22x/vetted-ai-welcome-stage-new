import { useState } from 'react';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusDropdown } from './StatusDropdown';
import { SLACountdown } from './SLACountdown';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  project_code: string;
  role_title: string;
  tier_name: string;
  candidate_source: string;
  candidate_count: number;
  payment_status: string;
  status: string;
  sla_deadline: string;
  created_at: string;
  recruiter: {
    full_name: string;
    email: string;
    organization: { name: string } | null;
  };
  talent_profiles: Array<{ count: number }>;
}

interface ProjectsTableProps {
  projects: Project[];
  onViewResumes: (projectId: string) => void;
  onUploadShortlist: (projectId: string) => void;
}

export const ProjectsTable = ({ projects, onViewResumes, onUploadShortlist }: ProjectsTableProps) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Recruiter / Org</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Role Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold"># Resumes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">SLA</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{project.recruiter.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.recruiter.organization?.name || project.recruiter.email}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{project.role_title}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">
                    {project.candidate_source === 'own' ? 'Own Candidates' : 'VettedAI Network'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{project.tier_name}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-center">{project.candidate_count}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      project.payment_status === 'paid'
                        ? 'bg-[#D1FAE5] text-[#22C55E] hover:bg-[#D1FAE5]'
                        : 'bg-[#FEF3C7] text-[#F59E0B] hover:bg-[#FEF3C7]'
                    }
                  >
                    {project.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <SLACountdown deadline={project.sla_deadline} />
                </td>
                <td className="px-4 py-3">
                  <StatusDropdown
                    projectId={project.id}
                    currentStatus={project.status}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewResumes(project.id)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUploadShortlist(project.id)}
                      disabled={project.status === 'ready'}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No projects found
        </div>
      )}
    </div>
  );
};
