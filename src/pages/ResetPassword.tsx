import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import wihuriLogo from "@/assets/wihuri-agri-logo.png";

const passwordSchema = z.string().min(6, "Parool peab olema vähemalt 6 tähemärki");

type PageState = "confirm" | "form" | "loading" | "error";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [flowType, setFlowType] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const hash = queryParams.get("token_hash");
    const type = queryParams.get("type");

    if (hash && (type === "recovery" || type === "invite")) {
      // We have a token — show confirmation button instead of auto-verifying
      setTokenHash(hash);
      setFlowType(type);
      setPageState("confirm");
      return;
    }

    // No token in URL — check if user already has a session (e.g. after successful verify)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState("form");
      } else {
        navigate("/auth", { replace: true });
      }
    };

    // Listen for auth state changes (PASSWORD_RECOVERY event from hash-based links)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setPageState("form");
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleConfirmToken = async () => {
    if (!tokenHash || !flowType) return;
    setPageState("loading");

    const { error } = await supabase.auth.verifyOtp({
      type: flowType as "recovery" | "invite",
      token_hash: tokenHash,
    });

    // Clear token from URL so refresh won't re-attempt
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
        title: "Viga",
        description: "Parooli seadistamine ebaõnnestus. Proovi uuesti.",
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
      toast({ title: "Parool edukalt salvestatud!" });
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
              <img src={wihuriLogo} alt="Wihuri Agri" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Parooli seadistamine</CardTitle>
            <CardDescription>Palun oota...</CardDescription>
          </CardHeader>
        );

      case "confirm":
        return (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <img src={wihuriLogo} alt="Wihuri Agri" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">Tere tulemast!</CardTitle>
              <CardDescription>
                Parooli loomiseks vajuta allolevale nupule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConfirmToken} className="w-full" size="lg">
                Kinnita ja loo parool →
              </Button>
            </CardContent>
          </>
        );

      case "error":
        return (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <img src={wihuriLogo} alt="Wihuri Agri" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">Link on aegunud</CardTitle>
              <CardDescription>
                See parooli seadistamise link on aegunud või juba kasutatud. Palun palu administraatorilt uut kutset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/auth", { replace: true })} className="w-full">
                Tagasi sisselogimisse
              </Button>
            </CardContent>
          </>
        );

      case "form":
        return (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <img src={wihuriLogo} alt="Wihuri Agri" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">Palun määra omale parool</CardTitle>
              <CardDescription>
                Selle parooliga saad edaspidi rakendusse sisse logida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Loo parool</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Vähemalt 6 tähemärki"
                    required
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Salvestan..." : "Salvesta parool"}
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
