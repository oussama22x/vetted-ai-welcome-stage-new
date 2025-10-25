import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
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

export const WorkspaceHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();

  const { fullName, initials, email } = useMemo(() => {
    const metadataName = user?.user_metadata && typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;
    const rawName = metadataName?.trim();
    const name = rawName && rawName.length > 0 ? rawName : null;
    const identifier = name ?? user?.email ?? "Account";
    const derivedInitials = identifier
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "V";

    return {
      fullName: name ?? identifier,
      initials: derivedInitials,
      email: user?.email ?? undefined,
    };
  }, [user]);

  const handleAccountSettings = () => {
    navigate("/settings");
  };

  const handleAdminPanel = () => {
    navigate("/admin/dashboard");
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
    <header className="border-b border-border bg-card">
      <div className="max-w-[960px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="VettedAI"
              className="h-8 w-8"
            />
            <span className="text-foreground font-semibold">
              VettedAI <span className="text-muted-foreground font-normal">• Recruiter Workspace</span>
            </span>
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
              {isAdmin && (
                <DropdownMenuItem onSelect={handleAdminPanel} className="cursor-pointer gap-2">
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer gap-2 text-destructive">
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
