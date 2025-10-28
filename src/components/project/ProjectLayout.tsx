import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import vettedLogo from "@/assets/vetted-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectLayoutProps {
  children: ReactNode;
}

export const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={vettedLogo} 
              alt="VettedAI" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold">VettedAI</h1>
              <p className="text-xs text-muted-foreground">Recruiter Workspace</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
