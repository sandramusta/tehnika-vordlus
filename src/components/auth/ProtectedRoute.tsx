import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import type { AppRole } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading, hasAnyRole } = useAuthContext();

  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
  const isRecoveryFlow =
    queryParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery" ||
    hashParams.has("access_token") ||
    queryParams.has("access_token");

  if (isRecoveryFlow && window.location.pathname !== "/password-recovery") {
    return <Navigate to={`/password-recovery${window.location.hash || ""}`} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laadin...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Ligipääs keelatud</h1>
          <p className="text-muted-foreground">
            Sul puuduvad õigused selle lehe vaatamiseks.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
