import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  role_title: string;
  status: string;
  created_at: string;
}

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

  return (
    <Link to={`/workspace/project/${project.id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold text-foreground line-clamp-2">
              {project.role_title}
            </h3>
            <Badge variant="secondary" className="whitespace-nowrap">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created on {format(new Date(project.created_at), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
