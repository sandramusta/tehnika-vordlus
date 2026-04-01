import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";


type PageState = "confirm" | "form" | "loading" | "error";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const passwordSchema = z.string().min(6, t("resetPassword.passwordMinLength"));
  const [pageState, setPageState] = useState<PageState>("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [flowType, setFlowType] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);

    // New flow: custom 24h setup token
    const setup = queryParams.get("setup_token");
    if (setup) {
      setSetupToken(setup);
      setPageState("confirm");
      return;
    }

    // Legacy flow: Supabase token_hash
    const hash = queryParams.get("token_hash");
    const type = queryParams.get("type");

    if (hash && (type === "recovery" || type === "invite")) {
      setTokenHash(hash);
      setFlowType(type);
      setPageState("confirm");
      return;
    }

    // No token in URL — check if user already has a session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState("form");
      } else {
        navigate("/auth", { replace: true });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setPageState("form");
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleConfirmToken = async () => {
    setPageState("loading");

    // New flow: custom setup token → call verify-setup-token edge function
    if (setupToken) {
      try {
        const { data, error } = await supabase.functions.invoke("verify-setup-token", {
          body: { setup_token: setupToken },
        });

        // Clear token from URL
        window.history.replaceState({}, "", window.location.pathname);

        if (error || !data?.success) {
          console.error("Setup token verification failed:", error || data?.error);
          setPageState("error");
          return;
        }

        // Use the fresh token_hash returned by the edge function
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: data.token_hash,
        });

        if (otpError) {
          console.error("OTP verification failed:", otpError.message);
          setPageState("error");
          return;
        }

        setPageState("form");
      } catch (err) {
        console.error("Setup token flow error:", err);
        window.history.replaceState({}, "", window.location.pathname);
        setPageState("error");
      }
      return;
    }

    // Legacy flow: direct Supabase token_hash
    if (!tokenHash || !flowType) return;

    const { error } = await supabase.auth.verifyOtp({
      type: flowType as "recovery" | "invite",
      token_hash: tokenHash,
    });

    window.history.replaceState({}, "", window.location.pathname);

    if (error) {
      console.error("Token verification failed:", error.message);
      setPageState("error");
      return;
    }

    setPageState("form");
  };

  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ password: err.errors[0].message });
      }
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: t("common.error"),
        description: t("resetPassword.passwordSetError"),
        variant: "destructive",
      });
    } else {
      // Log first login so admin panel shows "active" status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from("user_activity_logs").insert({
          user_id: user.id,
          action_type: "USER_LOGIN",
          details: {},
        });
      }
      toast({ title: t("resetPassword.passwordSetSuccess") });
      navigate("/", { replace: true });
    }

    setIsLoading(false);
  };

  const renderContent = () => {
    switch (pageState) {
      case "loading":
        return (
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
            </div>
            <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
            <CardDescription>{t("resetPassword.loading.description")}</CardDescription>
          </CardHeader>
        );

      case "confirm":
        return (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                </div>
              <CardTitle className="text-2xl">{t("resetPassword.welcome.title")}</CardTitle>
              <CardDescription>
                {t("resetPassword.welcome.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConfirmToken} className="w-full" size="lg">
                {t("resetPassword.welcome.button")}
              </Button>
            </CardContent>
          </>
        );

      case "error":
        return (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                </div>
              <CardTitle className="text-2xl">{t("resetPassword.error.title")}</CardTitle>
              <CardDescription>
                {t("resetPassword.error.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/auth", { replace: true })} className="w-full">
                {t("resetPassword.error.backButton")}
              </Button>
            </CardContent>
          </>
        );

      case "form":
        return (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                </div>
              <CardTitle className="text-2xl">{t("resetPassword.form.title")}</CardTitle>
              <CardDescription>
                {t("resetPassword.form.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("resetPassword.form.label")}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t("resetPassword.form.placeholder")}
                    required
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("resetPassword.form.savingButton") : t("resetPassword.form.submitButton")}
                </Button>
              </form>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
}
