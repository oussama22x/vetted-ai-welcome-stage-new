import { Link, useLocation, useNavigate } from "react-router-dom";
import { FolderOpen, Settings, CreditCard, Users, LogOut, ChevronDown, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "All Projects", href: "/workspace", icon: FolderOpen, enabled: true },
];

export const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isAdmin } = useAuth();

  const metadataName = user?.user_metadata && typeof user.user_metadata.full_name === "string"
    ? user.user_metadata.full_name
    : undefined;
  const normalizedName = metadataName?.trim();
  const fullName = normalizedName && normalizedName.length > 0 ? normalizedName : (user?.email ?? "Account");
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "V";

  const handleAdminPanel = () => {
    navigate('/admin/dashboard');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();

    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    navigate("/login");
  };

  return (
    <aside className="w-64 border-r border-border bg-card p-6 flex flex-col">
      <div className="mb-8 flex items-center gap-3">
        <img
          src="/favicon.png"
          alt="VettedAI"
          className="h-10 w-auto"
        />
        <div>
          <h2 className="text-xl font-bold text-primary">VettedAI</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Recruiter Workspace</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          if (!item.enabled) {
            return (
              <TooltipProvider key={item.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg",
                        "text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-3 px-3 h-auto py-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground">Manage account</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem onClick={handleAdminPanel}>
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </DropdownMenuItem>
            )}

            <DropdownMenuItem disabled>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing History
              <span className="ml-auto text-xs">Soon</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem disabled>
              <Users className="h-4 w-4 mr-2" />
              Invite Team
              <span className="ml-auto text-xs">Soon</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
