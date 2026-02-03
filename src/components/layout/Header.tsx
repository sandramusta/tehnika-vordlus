import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, MessageSquareWarning, Settings, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import wihuriLogo from "@/assets/wihuri-agri-logo.png";

const roleLabels: Record<string, string> = {
  user: "Kasutaja",
  product_manager: "Tootejuht",
  admin: "Admin",
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, canEdit, isAdmin } = useAuthContext();

  const navItems = [
    { href: "/", label: "Võrdlus", icon: BarChart3, show: true },
    { href: "/myths", label: "Müüdid", icon: MessageSquareWarning, show: true },
    { href: "/admin", label: "Admin", icon: Settings, show: canEdit },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const highestRole = profile?.roles.includes("admin")
    ? "admin"
    : profile?.roles.includes("product_manager")
    ? "product_manager"
    : "user";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={wihuriLogo} alt="Wihuri Agri" className="h-10 w-auto" />
          <span className="text-lg font-bold text-foreground">
            Tehnika võrdlus
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          {profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{profile.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                  <Badge
                    variant={isAdmin ? "default" : "secondary"}
                    className="mt-2"
                  >
                    {roleLabels[highestRole]}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logi välja
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
