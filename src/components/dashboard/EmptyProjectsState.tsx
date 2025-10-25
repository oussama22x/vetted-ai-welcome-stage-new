import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";

interface EmptyProjectsStateProps {
  onStartProject: () => void;
}

export const EmptyProjectsState = ({ onStartProject }: EmptyProjectsStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <FolderOpen className="w-12 h-12 text-primary" />
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        No Projects Yet
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Looks like you haven't started any projects yet! Click the button above to create your first VettedAI project and get started.
      </p>
      
      <Button onClick={onStartProject} size="lg">
        <Plus className="w-5 h-5 mr-2" />
        Start New Project
      </Button>
    </div>
  );
}
