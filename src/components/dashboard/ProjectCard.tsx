import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project } from "@/hooks/useUserProjects";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const statusLabels: Record<string, string> = {
    awaiting: "Awaiting Candidates",
    awaiting_network_match: "Sourcing via Network",
    draft: "Draft",
  };

  const statusLabel = statusLabels[project.status] ?? "In Progress";
  const companyName = project.company_name?.trim();
  const companyDisplay = companyName && companyName.length > 0 ? companyName : "Company TBD";

  return (
    <Link to={`/workspace/project/${project.id}`} className="block">
      <Card className="h-full border border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold text-foreground leading-tight line-clamp-2">
                {project.role_title}
              </h3>
              <p
                className={cn(
                  "text-sm text-muted-foreground line-clamp-1",
                  companyName ? "font-medium" : "italic"
                )}
              >
                {companyDisplay}
              </p>
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created on {format(new Date(project.created_at), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
