import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  role_title: string;
  status: string;
  payment_status: string;
  candidate_count: number;
  created_at: string;
  tier_name?: string;
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();
  
  const getStatusBadge = () => {
    switch (project.status) {
      case 'pending_activation':
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Activation</Badge>;
      case 'activation_in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Activation in Progress</Badge>;
      case 'awaiting_setup_call':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Setup Call Needed</Badge>;
      case 'ready':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Shortlist Ready</Badge>;
      case 'scoring':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Scoring</Badge>;
      default:
        return <Badge variant="secondary">In Progress</Badge>;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the book call button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/workspace/project/${project.id}`);
  };

  const handleBookCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open("https://calendly.com/lemuel-vettedai/30min", "_blank");
  };

  const getProgressInfo = () => {
    if (project.status === 'scoring' || project.status === 'ready') {
      // Placeholder logic - will be replaced with actual candidate completion data
      const completed = Math.floor(Math.random() * project.candidate_count);
      return {
        show: true,
        completed,
        total: project.candidate_count,
        percentage: (completed / project.candidate_count) * 100
      };
    }
    return { show: false };
  };

  const progressInfo = getProgressInfo();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-foreground line-clamp-2">
            {project.role_title}
          </h3>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {progressInfo.show && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progressInfo.completed}/{progressInfo.total} Candidates Completed
              </span>
            </div>
            <Progress value={progressInfo.percentage} className="h-2" />
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Created on {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
        </div>

        {project.tier_name && (
          <div className="text-sm text-muted-foreground">
            Tier: <span className="font-medium text-foreground">{project.tier_name}</span>
          </div>
        )}

        {project.status === 'awaiting_setup_call' && (
          <Button 
            onClick={handleBookCall}
            variant="default"
            size="sm"
            className="w-full gap-2"
          >
            <Calendar className="w-4 h-4" />
            Book Your Setup Call
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
