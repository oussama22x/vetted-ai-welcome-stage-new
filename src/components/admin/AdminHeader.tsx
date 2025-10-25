import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Settings, LayoutDashboard, ClipboardList, FolderKanban, Home } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Ops Console", href: "/ops", icon: ClipboardList },
  { name: "Active Projects", href: "/admin/projects", icon: FolderKanban },
];

export const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const { fullName, initials, email } = useMemo(() => {
    const metadataName = user?.user_metadata && typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;
    const rawName = metadataName?.trim();
    const name = rawName && rawName.length > 0 ? rawName : null;
    const identifier = name ?? user?.email ?? "Admin";
    const derivedInitials = identifier
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "A";

    return {
      fullName: name ?? identifier,
      initials: derivedInitials,
      email: user?.email ?? undefined,
    };
  }, [user]);

  const handleAccountSettings = () => {
    navigate("/settings");
  };

  const handleReturnToWorkspace = () => {
    navigate("/workspace");
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
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img
                src="/favicon.png"
                alt="VettedAI"
                className="h-8 w-8"
              />
              <span className="text-foreground font-semibold">
                VettedAI <span className="text-muted-foreground font-normal">• Admin Panel</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "gap-2 transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 px-2 max-w-[280px]">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-medium leading-none truncate w-full">{fullName}</span>
                  {email && (
                    <span className="text-xs text-muted-foreground leading-none truncate w-full mt-1">{email}</span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="truncate">{fullName}</DropdownMenuLabel>
              {email && <p className="text-xs text-muted-foreground px-2 pb-2 truncate">{email}</p>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleAccountSettings} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span>Account settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleReturnToWorkspace} className="cursor-pointer gap-2">
                <Home className="h-4 w-4 flex-shrink-0" />
                <span>Return to Workspace</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer gap-2 text-destructive">
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 mt-3 overflow-x-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.href)}
                className={cn(
                  "gap-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
