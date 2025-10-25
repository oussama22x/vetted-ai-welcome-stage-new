import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyProjectsState } from "@/components/dashboard/EmptyProjectsState";
import { useUserProjects } from "@/hooks/useUserProjects";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, isLoading, refetch } = useUserProjects();

  useEffect(() => {
    if (location.state?.refetch || location.state?.refetchToken) {
      void refetch().finally(() => {
        navigate(location.pathname, { replace: true });
      });
    }
  }, [location, navigate, refetch]);

  const handleStartNewProject = () => {
    navigate('/workspace/new/jd-upload');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Your VettedAI workspace</h1>
            <Button onClick={handleStartNewProject} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Start New Project
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyProjectsState onStartProject={handleStartNewProject} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
