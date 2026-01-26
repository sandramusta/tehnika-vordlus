import { Link, useLocation } from "react-router-dom";
import { BarChart3, MessageSquareWarning, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import wihuriLogo from "@/assets/wihuri-agri-logo.png";

const navItems = [
  { href: "/", label: "Võrdlus", icon: BarChart3 },
  { href: "/myths", label: "Müüdid", icon: MessageSquareWarning },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={wihuriLogo} alt="Wihuri Agri" className="h-10 w-auto" />
          <span className="text-lg font-bold text-foreground">
            Tehnika võrdlus
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
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
      </div>
    </header>
  );
}
