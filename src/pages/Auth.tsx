import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";


export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading, signIn } = useAuthContext();

  const emailSchema = z.string().email(t("auth.invalidEmail"));
  const passwordSchema = z.string().min(6, t("auth.passwordMinLength"));
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expiredLinkMessage, setExpiredLinkMessage] = useState<string | null>(null);

  // Check for auth error params (e.g. expired invitation link)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const authLinkType = searchParams.get("type") || hashParams.get("type");
    const hasAuthToken = hashParams.has("access_token") || searchParams.has("access_token");
    const errorCode = searchParams.get("error_code") || hashParams.get("error_code");
    const error = searchParams.get("error") || hashParams.get("error");

    // Invite/recovery links should always go to password setup
    if (authLinkType === "invite" || authLinkType === "recovery" || hasAuthToken) {
      navigate(`/reset${window.location.hash || ""}`, { replace: true });
      return;
    }
    
    if (errorCode === "otp_expired" || error === "access_denied") {
      setExpiredLinkMessage(t("auth.expiredLink"));
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const authLinkType = searchParams.get("type") || hashParams.get("type");
    const hasAuthToken = hashParams.has("access_token") || searchParams.has("access_token");

    if (!loading && user && !expiredLinkMessage && authLinkType !== "invite" && authLinkType !== "recovery" && !hasAuthToken) {
      navigate("/");
    }
  }, [user, loading, navigate, expiredLinkMessage, searchParams]);

  const validateField = (field: string, value: string) => {
    try {
      if (field === "email") {
        emailSchema.parse(value);
      } else if (field === "password") {
        passwordSchema.parse(value);
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: e.errors[0].message }));
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!validateField("email", email) || !validateField("password", password)) {
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      let message = t("auth.signInError");
      if (error.message.includes("Invalid login credentials")) {
        message = t("auth.invalidCredentials");
      } else if (error.message.includes("Email not confirmed")) {
        message = t("auth.emailNotConfirmed");
      }
      toast({
        title: t("auth.error"),
        description: message,
        variant: "destructive",
      });
    } else {
      // Reset inactivity timer so Layout doesn't immediately sign out
      localStorage.setItem("last_activity_timestamp", Date.now().toString());
      toast({ title: t("auth.signInSuccess") });
      navigate("/");
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t("auth.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-2xl">{t("auth.cardTitle")}</CardTitle>
          <CardDescription>
            {t("auth.signInDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiredLinkMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{expiredLinkMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.emailLabel")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.loading") : t("auth.signInButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
